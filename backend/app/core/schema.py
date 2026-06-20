"""Schema Introspection Service

Handles connecting to external databases (PostgreSQL, Snowflake, BigQuery, etc.)
and extracting metadata (tables, columns, keys, relationships) ONLY — never
fetches or stores actual row data.

Results are cached in the local AnalystFlow metadata database for fast LLM
context building and reduced introspection overhead.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import inspect as sa_inspect, create_engine, text
from sqlalchemy.engine import Engine, Inspector

from app.config import settings
from app.core.database import get_engine


def _now() -> str:
    """Return current UTC timestamp as ISO 8601 string."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


class SchemaService:
    """Service for introspecting external database schemas and caching results."""

    def __init__(self):
        self.local_engine = get_engine()

    # ── Connection Testing ──────────────────────────────────────────────

    def test_connection(self, connection_string: str) -> dict:
        """Test a database connection string without saving anything.
        
        Returns dict with:
          - success: bool
          - server_version: str (if available)
          - tables: list[str] (table names found)
          - error: str (if failed)
        """
        result = {"success": False, "server_version": None, "tables": [], "error": None}
        try:
            engine = create_engine(connection_string, connect_args={"connect_timeout": 10})
            with engine.connect() as conn:
                # Verify connection works
                version_result = conn.execute(text("SELECT version()"))
                result["server_version"] = version_result.scalar()

                # Get table names only — NO row data
                inspector = sa_inspect(engine)
                result["tables"] = inspector.get_table_names()
                result["success"] = True
        except Exception as e:
            result["error"] = str(e)

        return result

    # ── Connection Management ───────────────────────────────────────────

    def save_connection(self, workspace_id: str, name: str, engine_id: str,
                        host: str = None, port: int = None,
                        database_name: str = None, username: str = None,
                        password: str = None, extra_params: dict = None,
                        description: str = None, created_by: str = None) -> dict:
        """Save a new database connection record.
        
        Note: In production, password should be encrypted with app-level
        AES-256-GCM key. For MVP, we store in plaintext with a warning.
        """
        conn_id = str(uuid.uuid4())
        
        with self.local_engine.begin() as conn:
            conn.execute(
                text("""
                    INSERT INTO db_connections 
                        (id, workspace_id, name, description, engine_id,
                         host, port, database_name, username, password_enc,
                         extra_params, created_by)
                    VALUES (:id, :ws_id, :name, :desc, :engine_id,
                            :host, :port, :db_name, :username, :password,
                            :params, :created_by)
                """),
                {
                    "id": conn_id,
                    "ws_id": workspace_id,
                    "name": name,
                    "desc": description,
                    "engine_id": engine_id,
                    "host": host,
                    "port": port,
                    "db_name": database_name,
                    "username": username,
                    "password": password,
                    "params": str(extra_params or {}),
                    "created_by": created_by or "system",
                }
            )
        
        return {"id": conn_id, "name": name, "engine_id": engine_id}

    def get_connections(self, workspace_id: str) -> list[dict]:
        """List all connections in a workspace."""
        with self.local_engine.connect() as conn:
            rows = conn.execute(
                text("""
                    SELECT c.id, c.name, c.description, c.engine_id, e.name as engine_name,
                           c.host, c.port, c.database_name, c.username,
                           c.is_active, c.last_connected_at, c.error_count,
                           c.created_at
                    FROM db_connections c
                    JOIN db_engines e ON e.id = c.engine_id
                    WHERE c.workspace_id = :ws_id AND c.deleted_at IS NULL
                    ORDER BY c.created_at DESC
                """),
                {"ws_id": workspace_id}
            ).mappings().fetchall()
        return [dict(r) for r in rows]

    def get_connection(self, connection_id: str) -> Optional[dict]:
        """Get a single connection by ID."""
        with self.local_engine.connect() as conn:
            row = conn.execute(
                text("""
                    SELECT c.id, c.name, c.description, c.engine_id, e.name as engine_name,
                           c.host, c.port, c.database_name, c.username,
                           c.password_enc, c.extra_params,
                           c.is_active, c.last_connected_at, c.error_count
                    FROM db_connections c
                    JOIN db_engines e ON e.id = c.engine_id
                    WHERE c.id = :cid AND c.deleted_at IS NULL
                """),
                {"cid": connection_id}
            ).mappings().fetchone()
        return dict(row) if row else None

    def delete_connection(self, connection_id: str) -> bool:
        """Soft-delete a database connection."""
        with self.local_engine.begin() as conn:
            result = conn.execute(
                text("UPDATE db_connections SET deleted_at = :now WHERE id = :cid"),
                {"now": _now(), "cid": connection_id}
            )
            return result.rowcount > 0

    def build_connection_string(self, connection: dict) -> str:
        """Build a SQLAlchemy connection string from a connection record."""
        engine_id = connection["engine_id"]
        
        # For SQLite, database_name is the file path
        if engine_id == "sqlite":
            return f"sqlite:///{connection.get('database_name', './analystflow.db')}"
        
        # For BigQuery, use a different format
        if engine_id == "bigquery":
            return f"bigquery://{connection.get('database_name', '')}"
        
        # For Snowflake
        if engine_id == "snowflake":
            return (
                f"snowflake://{connection.get('username', '')}"
                f":{connection.get('password_enc', '')}"
                f"@{connection.get('host', '')}"
                f"/{connection.get('database_name', '')}"
            )
        
        # Standard SQLAlchemy connection string
        port = connection.get("port")
        port_str = f":{port}" if port else ""
        db = connection.get("database_name", "")
        
        return (
            f"{engine_id}://{connection.get('username', '')}"
            f":{connection.get('password_enc', '')}"
            f"@{connection.get('host', '')}{port_str}/{db}"
        )

    # ── Schema Introspection ────────────────────────────────────────────

    def introspect_and_cache(self, connection_id: str) -> dict:
        """Introspect a database schema and cache it locally.
        
        This method:
          1. Loads the connection record
          2. Connects to the external database
          3. Introspects schema metadata (tables, columns, PKs, FKs) ONLY
          4. Caches results in local analystflow.db
          5. Never fetches or stores actual row data
        
        Returns a summary dict of what was cached.
        """
        connection = self.get_connection(connection_id)
        if not connection:
            raise ValueError(f"Connection {connection_id} not found")
        
        conn_string = self.build_connection_string(connection)
        engine = create_engine(conn_string, connect_args={"connect_timeout": 30})
        inspector = sa_inspect(engine)
        
        summary = {
            "connection_id": connection_id,
            "schemas": [],
            "total_tables": 0,
            "total_columns": 0,
        }
        
        # Get all schema names (or default to 'public')
        try:
            schema_names = inspector.get_schema_names()
        except Exception:
            schema_names = ["public"]
        
        # Limit to reasonable schemas (skip system schemas)
        schema_names = [
            s for s in schema_names
            if not s.startswith(("pg_", "information_schema", "_"))
        ][:20]  # Cap at 20 schemas
        
        with self.local_engine.begin() as local_conn:
            for schema_name in schema_names:
                schema_id = str(uuid.uuid4())
                
                # Upsert schema record
                existing = local_conn.execute(
                    text("SELECT id FROM cached_schemas WHERE connection_id = :cid AND schema_name = :sn"),
                    {"cid": connection_id, "sn": schema_name}
                ).fetchone()
                
                if existing:
                    schema_id = existing[0]
                    # Clear old table data
                    # Need to delete tables first due to FK constraints
                    table_ids = local_conn.execute(
                        text("SELECT id FROM cached_tables WHERE schema_id = :sid"),
                        {"sid": schema_id}
                    ).fetchall()
                    for (tid,) in table_ids:
                        local_conn.execute(
                            text("DELETE FROM cached_columns WHERE table_id = :tid"),
                            {"tid": tid}
                        )
                        local_conn.execute(
                            text("DELETE FROM cached_relationships WHERE table_id = :tid OR referenced_table_id = :tid2"),
                            {"tid": tid, "tid2": tid}
                        )
                    local_conn.execute(
                        text("DELETE FROM cached_tables WHERE schema_id = :sid"),
                        {"sid": schema_id}
                    )
                
                # Get table names (schema only, NO row data)
                table_names = inspector.get_table_names(schema=schema_name)
                view_names = inspector.get_view_names(schema=schema_name)
                
                schema_tables = []
                
                # Process regular tables
                for table_name in table_names:
                    table_info = self._introspect_table(
                        local_conn, inspector, schema_id, table_name, schema_name, "table"
                    )
                    schema_tables.append(table_info)
                
                # Process views
                for view_name in view_names:
                    table_info = self._introspect_table(
                        local_conn, inspector, schema_id, view_name, schema_name, "view"
                    )
                    schema_tables.append(table_info)
                
                # Update schema record
                raw_text = self._build_schema_text(inspector, schema_name, table_names + view_names)
                
                local_conn.execute(
                    text("""
                        INSERT OR REPLACE INTO cached_schemas
                            (id, connection_id, schema_name, raw_schema_text,
                             table_count, last_introspected_at, updated_at)
                        VALUES (:id, :cid, :sn, :raw, :count, :now, :now)
                    """),
                    {
                        "id": schema_id,
                        "cid": connection_id,
                        "sn": schema_name,
                        "raw": raw_text,
                        "count": len(schema_tables),
                        "now": _now(),
                    }
                )
                
                summary["schemas"].append({
                    "schema_name": schema_name,
                    "table_count": len(schema_tables),
                    "tables": schema_tables,
                })
                summary["total_tables"] += len(schema_tables)
                summary["total_columns"] += sum(t["column_count"] for t in schema_tables)
            
            # Update last_connected_at on the connection
            local_conn.execute(
                text("UPDATE db_connections SET last_connected_at = :now, error_count = 0 WHERE id = :cid"),
                {"now": _now(), "cid": connection_id}
            )
        
        return summary

    def _introspect_table(self, local_conn, inspector: Inspector,
                          schema_id: str, table_name: str,
                          schema_name: str, table_type: str) -> dict:
        """Introspect a single table and cache its metadata."""
        table_id = str(uuid.uuid4())
        
        # Get column metadata
        columns = inspector.get_columns(table_name, schema=schema_name)
        pk_constraint = inspector.get_pk_constraint(table_name, schema=schema_name)
        fk_constraints = inspector.get_foreign_keys(table_name, schema=schema_name)
        try:
            table_comment = inspector.get_table_comment(table_name, schema=schema_name)
            comment_text = table_comment.get("text") if table_comment else None
        except Exception:
            comment_text = None
        
        pk_columns = set(pk_constraint.get("constrained_columns", []))
        
        # Build FK lookup
        fk_map = {}  # column_name -> ref_table.ref_column
        for fk in fk_constraints:
            for i, col in enumerate(fk["constrained_columns"]):
                ref_cols = fk["referred_columns"]
                ref_col = ref_cols[i] if i < len(ref_cols) else ref_cols[0]
                fk_map[col] = f"{fk['referred_schema'] or schema_name}.{fk['referred_table']}.{ref_col}"
        
        # Insert table record
        local_conn.execute(
            text("""
                INSERT INTO cached_tables
                    (id, schema_id, table_name, table_type, description)
                VALUES (:id, :sid, :name, :type, :desc)
            """),
            {
                "id": table_id,
                "sid": schema_id,
                "name": table_name,
                "type": table_type,
                "desc": comment_text,
            }
        )
        
        # Insert column records
        column_ids = {}
        for i, col in enumerate(columns):
            col_id = str(uuid.uuid4())
            col_type_str = str(col["type"])
            is_pk = col["name"] in pk_columns
            is_fk = col["name"] in fk_map
            
            local_conn.execute(
                text("""
                    INSERT INTO cached_columns
                        (id, table_id, column_name, ordinal_position, data_type,
                         is_nullable, is_primary_key, is_foreign_key,
                         default_value, max_length, numeric_precision,
                         numeric_scale, description, foreign_key_ref)
                    VALUES (:id, :tid, :name, :pos, :dtype,
                            :nullable, :pk, :fk,
                            :default, :max_len, :precision,
                            :scale, :desc, :fk_ref)
                """),
                {
                    "id": col_id,
                    "tid": table_id,
                    "name": col["name"],
                    "pos": i + 1,
                    "dtype": col_type_str,
                    "nullable": 1 if col.get("nullable", True) else 0,
                    "pk": 1 if is_pk else 0,
                    "fk": 1 if is_fk else 0,
                    "default": str(col.get("default", "") or ""),
                    "max_len": getattr(col["type"], "length", None),
                    "precision": getattr(col["type"], "precision", None),
                    "scale": getattr(col["type"], "scale", None),
                    "desc": col.get("comment", None),
                    "fk_ref": fk_map.get(col["name"], None),
                }
            )
            column_ids[col["name"]] = col_id
        
        # Insert relationship records for FK constraints
        for fk in fk_constraints:
            for i, col_name in enumerate(fk["constrained_columns"]):
                ref_cols = fk["referred_columns"]
                ref_col_name = ref_cols[i] if i < len(ref_cols) else ref_cols[0]
                
                # Find the referenced table ID in our cache
                ref_schema = fk.get("referred_schema", schema_name)
                ref_table_name = fk["referred_table"]
                ref_row = local_conn.execute(
                    text("""SELECT id FROM cached_tables t
                           JOIN cached_schemas s ON s.id = t.schema_id
                           WHERE t.table_name = :tn AND s.schema_name = :sn
                           LIMIT 1"""),
                    {"tn": ref_table_name, "sn": ref_schema}
                ).fetchone()
                
                if ref_row:
                    ref_table_id = ref_row[0]
                    # Find the referenced column ID
                    ref_col_row = local_conn.execute(
                        text("""SELECT id FROM cached_columns
                               WHERE table_id = :tid AND column_name = :cn
                               LIMIT 1"""),
                        {"tid": ref_table_id, "cn": ref_col_name}
                    ).fetchone()
                    
                    if ref_col_row and col_name in column_ids:
                        local_conn.execute(
                            text("""
                                INSERT INTO cached_relationships
                                    (id, table_id, column_id,
                                     referenced_table_id, referenced_column_id,
                                     constraint_name, relationship_type)
                                VALUES (:id, :tid, :cid, :rtid, :rcid, :cname, :rtype)
                            """),
                            {
                                "id": str(uuid.uuid4()),
                                "tid": table_id,
                                "cid": column_ids[col_name],
                                "rtid": ref_table_id,
                                "rcid": ref_col_row[0],
                                "cname": fk.get("name", ""),
                                "rtype": "foreign_key",
                            }
                        )
        
        return {
            "table_id": table_id,
            "table_name": table_name,
            "table_type": table_type,
            "column_count": len(columns),
        }

    def _build_schema_text(self, inspector: Inspector,
                            schema_name: str,
                            table_names: list[str]) -> str:
        """Build a human-readable schema description for LLM prompts."""
        parts = []
        for table_name in table_names:
            columns = inspector.get_columns(table_name, schema=schema_name)
            pk = inspector.get_pk_constraint(table_name, schema=schema_name)
            fks = inspector.get_foreign_keys(table_name, schema=schema_name)
            
            col_lines = []
            for col in columns:
                nullable = "NULL" if col.get("nullable", True) else "NOT NULL"
                col_lines.append(f"  - {col['name']} ({col['type']}) {nullable}")
            
            pk_cols = pk.get("constrained_columns", [])
            if pk_cols:
                col_lines.append(f"  - PRIMARY KEY: ({', '.join(pk_cols)})")
            
            for fk in fks:
                ref = f"{fk['referred_schema'] + '.' if fk.get('referred_schema') else ''}{fk['referred_table']}"
                col_lines.append(
                    f"  - FOREIGN KEY ({', '.join(fk['constrained_columns'])}) → {ref}({', '.join(fk['referred_columns'])})"
                )
            
            parts.append(f"Table: {table_name}\n" + "\n".join(col_lines))
        
        return "\n\n".join(parts)

    # ── Schema Retrieval ───────────────────────────────────────────────

    def get_cached_schema(self, connection_id: str, schema_name: str = "public") -> Optional[str]:
        """Get the cached raw schema text for LLM prompts."""
        with self.local_engine.connect() as conn:
            row = conn.execute(
                text("""SELECT raw_schema_text FROM cached_schemas
                       WHERE connection_id = :cid AND schema_name = :sn"""),
                {"cid": connection_id, "sn": schema_name}
            ).fetchone()
        return row[0] if row else None

    def get_cached_tables(self, connection_id: str) -> list[dict]:
        """Get all cached tables with their column info for a connection."""
        with self.local_engine.connect() as conn:
            rows = conn.execute(
                text("""
                    SELECT ct.id, ct.table_name, ct.table_type, ct.description,
                           cc.column_name, cc.data_type, cc.is_nullable,
                           cc.is_primary_key, cc.is_foreign_key, cc.foreign_key_ref
                    FROM cached_schemas cs
                    JOIN cached_tables ct ON ct.schema_id = cs.id
                    JOIN cached_columns cc ON cc.table_id = ct.id
                    WHERE cs.connection_id = :cid
                    ORDER BY ct.table_name, cc.ordinal_position
                """),
                {"cid": connection_id}
            ).mappings().fetchall()
        return [dict(r) for r in rows]

    def delete_cached_schema(self, connection_id: str):
        """Delete all cached schema data for a connection."""
        with self.local_engine.begin() as conn:
            schema_ids = conn.execute(
                text("SELECT id FROM cached_schemas WHERE connection_id = :cid"),
                {"cid": connection_id}
            ).fetchall()
            for (sid,) in schema_ids:
                table_ids = conn.execute(
                    text("SELECT id FROM cached_tables WHERE schema_id = :sid"),
                    {"sid": sid}
                ).fetchall()
                for (tid,) in table_ids:
                    conn.execute(text("DELETE FROM cached_columns WHERE table_id = :tid"), {"tid": tid})
                    conn.execute(text("DELETE FROM cached_relationships WHERE table_id = :tid OR referenced_table_id = :tid2"),
                                 {"tid": tid, "tid2": tid})
                conn.execute(text("DELETE FROM cached_tables WHERE schema_id = :sid"), {"sid": sid})
            conn.execute(text("DELETE FROM cached_schemas WHERE connection_id = :cid"), {"cid": connection_id})
