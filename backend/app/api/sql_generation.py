"""API — SQL Generation

Endpoint for translating natural language to SQL queries.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/sql", tags=["sql"])


class SQLGenerateRequest(BaseModel):
    question: str
    dialect: str = "sqlite"
    max_rows: int = 100


class SQLGenerateResponse(BaseModel):
    sql: str
    explanation: str
    token_count: int = 0


class SQLExplainRequest(BaseModel):
    sql: str
    schema: str = ""


class SQLExplainResponse(BaseModel):
    explanation: str


@router.post("/generate", response_model=SQLGenerateResponse)
async def generate_sql(request: SQLGenerateRequest):
    """Translate a natural language question to a SQL query."""
    # TODO: Implement LLM-based SQL generation
    raise HTTPException(status_code=501, detail="Not yet implemented")


@router.post("/explain", response_model=SQLExplainResponse)
async def explain_sql(request: SQLExplainRequest):
    """Explain a SQL query in plain English."""
    # TODO: Implement LLM-based SQL explanation
    raise HTTPException(status_code=501, detail="Not yet implemented")