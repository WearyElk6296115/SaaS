"""API — Visualization

Endpoint for generating chart code and data from queries.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/visualize", tags=["visualization"])


class VizGenerateRequest(BaseModel):
    question: str
    sql: str
    chart_type: str = "auto"


class VizGenerateResponse(BaseModel):
    chart_code: str
    chart_type: str
    data_summary: dict = {}


@router.post("/generate", response_model=VizGenerateResponse)
async def generate_visualization(request: VizGenerateRequest):
    """Generate visualization code from a SQL query result."""
    # TODO: Implement visualization generation
    raise HTTPException(status_code=501, detail="Not yet implemented")