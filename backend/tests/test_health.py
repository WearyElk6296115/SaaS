"""Basic health check test for the FastAPI application."""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health():
    """Test that the health endpoint returns OK."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "version" in data