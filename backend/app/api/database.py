"""API — Database Connection & Schema Introspection

Endpoints for managing database connections and caching their schemas.
Supports PostgreSQL, Snowflake, BigQuery, MySQL, SQLite, and more.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from app.core.schema import SchemaService

router = APIRouter(prefix="/api/v1/database", tags=["database"])
schema_service = SchemaService()


# ── Request / Response Models ───────────────────────────────────────────────

class TestConnectionRequest(BaseModel):
    connection_string: str


class TestConnectionResponse(BaseModel):
    success: bool
    server_version: Optional[str] = None
    tables: list[str] = []
    error: Optional[str] = None


class CreateConnectionRequest(BaseModel):
    workspace_id: str = "default"
    name: str = Field(..., min_length=1, max_length=200)
    engine_id: str = Field(..., description="Engine ID: postgresql, mysql, snowflake, bigquery, sqlite, redshift")
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    password: Optional[str] = None
    extra_params: Optional[dict] = None
    description: Optional[str] = None


class ConnectionResponse(BaseModel):
    id: str
    name: str
    engine_id: str
    engine_name: Optional[str] = None
    host: Optional[str] = None
    port: Optional[int] = None
    database_name: Optional[str] = None
    username: Optional[str] = None
    is_active: bool = True
    last_connected_at: Optional[str] = None
    error_count: int = 0
    created_at: Optional[str] = None


class SyncSchemaResponse(BaseModel):
    connection_id: str
    schemas: list[dict] = []
    total_tables: int = 0
    total_columns: int = 0


class SchemaTextResponse(BaseModel):
    schema_name: str
    raw_schema_text: str
    table_count: int


class TableInfo(BaseModel):
    table_name: str
    table_type: str
    column_name: str
    data_type: str
    is_nullable: bool
    is_primary_key: bool
    is_foreign_key: bool
    foreign_key_ref: Optional[str] = None


# ── API Endpoints ───────────────────────────────────────────────────────────

@router.post("/test", response_model=TestConnectionResponse)
async def test_connection(request: TestConnectionRequest):
    """Test a database connection string without saving anything.
    
    This endpoint connects to the target database, retrieves version
    information and table names, then disconnects. No data is stored.
    """
    result = schema_service.test_connection(request.connection_string)
    return TestConnectionResponse(
        success=result["success"],
        server_version=result["server_version"],
        tables=result["tables"],
        error=result["error"],
    )


@router.post("/connections", response_model=ConnectionResponse, status_code=201)
async def create_connection(request: CreateConnectionRequest):
    """Save a new database connection configuration.
    
    The connection is stored in the local metadata database with
    connection parameters. Password should be encrypted in production.
    Schema is NOT introspected automatically — call the sync endpoint.
    """
    # Validate engine exists
    valid_engines = {
        "postgresql", "mysql", "snowflake", "bigquery", "sqlite", "redshift"
    }
    if request.engine_id not in valid_engines:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported engine '{request.engine_id}'. "
                   f"Supported: {', '.join(sorted(valid_engines))}"
        )
    
    result = schema_service.save_connection(
        workspace_id=request.workspace_id,
        name=request.name,
        engine_id=request.engine_id,
        host=request.host,
        port=request.port,
        database_name=request.database_name,
        username=request.username,
        password=request.password,
        extra_params=request.extra_params,
        description=request.description,
    )
    return ConnectionResponse(**result)


@router.get("/connections", response_model=list[ConnectionResponse])
async def list_connections(workspace_id: str = "default"):
    """List all saved database connections in a workspace."""
    connections = schema_service.get_connections(workspace_id)
    return [ConnectionResponse(**c) for c in connections]


@router.get("/connections/{connection_id}", response_model=ConnectionResponse)
async def get_connection(connection_id: str):
    """Get details for a specific database connection."""
    conn = schema_service.get_connection(connection_id)
    if not conn:
        raise HTTPException(status_code=404, detail="Connection not found")
    return ConnectionResponse(**conn)


@router.delete("/connections/{connection_id}", status_code=204)
async def delete_connection(connection_id: str):
    """Delete a database connection (soft delete)."""
    deleted = schema_service.delete_connection(connection_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Connection not found")
    return None


@router.post("/schema/sync/{connection_id}", response_model=SyncSchemaResponse)
async def sync_schema(connection_id: str):
    """Introspect and cache the full schema for a database connection.
    
    Connects to the external database, extracts ONLY metadata
    (table names, column names, types, constraints),
    and caches it in the local AnalystFlow database.
    
    No row data is ever fetched or stored during introspection.
    """
    try:
        result = schema_service.introspect_and_cache(connection_id)
        return SyncSchemaResponse(**result)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Schema introspection failed: {str(e)}"
        )


@router.get("/schema/{connection_id}", response_model=SchemaTextResponse)
async def get_schema(connection_id: str, schema_name: str = "public"):
    """Get the cached schema as formatted text (for LLM prompts)."""
    raw_text = schema_service.get_cached_schema(connection_id, schema_name)
    if not raw_text:
        raise HTTPException(
            status_code=404,
            detail=f"No cached schema found for connection {connection_id}. "
                   f"Call POST /api/v1/database/schema/sync/{connection_id} first."
        )
    return SchemaTextResponse(
        schema_name=schema_name,
        raw_schema_text=raw_text,
        table_count=raw_text.count("Table: "),
    )


@router.get("/schema/{connection_id}/tables", response_model=list[TableInfo])
async def get_schema_tables(connection_id: str):
    """Get cached table and column information as structured data."""
    tables = schema_service.get_cached_tables(connection_id)
    if not tables:
        raise HTTPException(
            status_code=404,
            detail=f"No cached schema found for connection {connection_id}"
        )
    return [TableInfo(**t) for t in tables]


@router.delete("/schema/{connection_id}", status_code=204)
async def delete_cached_schema(connection_id: str):
    """Clear the cached schema for a connection (forces re-introspection)."""
    schema_service.delete_cached_schema(connection_id)
    return None


# ── Engine List ─────────────────────────────────────────────────────────────

class EngineInfo(BaseModel):
    id: str
    name: str
    default_port: Optional[int] = None
    jdbc_prefix: Optional[str] = None


@router.get("/engines", response_model=list[EngineInfo])
async def list_engines():
    """List all supported database engines."""
    from app.core.database import get_engine
    from sqlalchemy import text
    engine = get_engine()
    with engine.connect() as conn:
        rows = conn.execute(
            text("SELECT id, name, default_port, jdbc_prefix FROM db_engines WHERE is_active = 1")
        ).mappings().fetchall()
    return [EngineInfo(**dict(r)) for r in rows]