# AnalystFlow — Development Conventions

## Code Standards
- **Python**: Follow PEP 8, use type hints everywhere
- **TypeScript**: Use strict mode, prefer interfaces over types
- **Imports**: Group standard lib, third-party, local (alphabetical)
- **Error handling**: Use custom exception classes, return structured error responses

## Backend Patterns
- Routes in `app/api/` are thin — delegate to `app/core/` for business logic
- Use Pydantic models for all request/response schemas
- LLM calls go through `app/core/llm.py` abstraction layer
- Use async endpoints where I/O is involved (DB, LLM API)

## Frontend Patterns
- Components in `src/components/` — one file per component
- Pages in `src/pages/` — route-level components
- API calls through `src/api/client.ts`
- Use TanStack Query for server state management

## Git Workflow
- Branch from `main`: `feature/<description>` or `fix/<description>`
- Keep PRs focused and reviewable (< 400 lines)
- Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`

## Testing
- Backend: pytest with pytest-asyncio
- Frontend: Vitest + React Testing Library
- Aim for >80% coverage on core business logic