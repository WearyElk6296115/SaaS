# AnalystFlow — AI-Powered Data Analyst Co-Pilot

An AI-powered co-pilot for data analysts that automates SQL generation, data cleaning, and visualization, turning hours of manual labor into minutes of oversight.

## Tech Stack

- **Backend**: FastAPI (Python 3.11+)
- **Frontend**: React 18 + Vite + TypeScript
- **AI**: OpenAI / Anthropic API (direct LLM integration)
- **Database**: SQLite (dev) / PostgreSQL (prod)

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Running with Docker

```bash
docker-compose up
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI entry point
│   ├── config.py            # Settings & environment
│   ├── api/                 # Route handlers
│   ├── core/                # Business logic
│   └── models/              # Pydantic models
frontend/
├── src/
│   ├── components/          # UI components
│   ├── pages/               # Route pages
│   ├── api/                 # API client
│   └── types/               # TypeScript types
```