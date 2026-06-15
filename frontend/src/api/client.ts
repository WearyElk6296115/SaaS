/** API Types and Client */

// ── API Response Types ──────────────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  version: string;
}

export interface SQLGenerateRequest {
  question: string;
  dialect?: string;
  max_rows?: number;
}

export interface SQLGenerateResponse {
  sql: string;
  explanation: string;
  token_count: number;
}

export interface SQLExplainResponse {
  explanation: string;
}

export interface CleaningIssue {
  column: string;
  issue_type: string;
  description: string;
  suggestion: string;
  confidence: string;
}

export interface CleaningAnalysisResponse {
  issues: CleaningIssue[];
  dataset_profile: Record<string, unknown>;
}

export interface ConnectResponse {
  connected: boolean;
  tables: string[];
}

export interface QueryResponse {
  columns: string[];
  rows: unknown[][];
  row_count: number;
  execution_time_ms: number;
}

// ── API Client ──────────────────────────────────────────────────────────────

const BASE_URL = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(error.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  health: () => request<HealthResponse>("/health"),

  sql: {
    generate: (data: SQLGenerateRequest) =>
      request<SQLGenerateResponse>("/v1/sql/generate", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    explain: (sql: string) =>
      request<SQLExplainResponse>("/v1/sql/explain", {
        method: "POST",
        body: JSON.stringify({ sql }),
      }),
  },

  database: {
    connect: (connectionString: string) =>
      request<ConnectResponse>("/v1/database/connect", {
        method: "POST",
        body: JSON.stringify({ connection_string: connectionString }),
      }),
    query: (sql: string) =>
      request<QueryResponse>("/v1/database/query", {
        method: "POST",
        body: JSON.stringify({ sql }),
      }),
    schema: () => request<string>("/v1/database/schema"),
  },

  cleaning: {
    analyze: (data: Record<string, unknown>) =>
      request<CleaningAnalysisResponse>("/v1/cleaning/analyze", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};