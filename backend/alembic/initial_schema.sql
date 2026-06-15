-- ============================================================================
-- AnalystFlow Core Database Schema
-- ============================================================================
-- Target: SQLite (MVP) → PostgreSQL (Production)
-- Design principles:
--   - UUID primary keys throughout for distributed compatibility
--   - ISO 8601 timestamps stored as TEXT in SQLite, TIMESTAMPTZ in Postgres
--   - Soft deletes via deleted_at for data recovery
--   - JSON fields for flexible metadata/extensible attributes
--   - Indexes on all foreign keys and frequently-queried columns
-- ============================================================================

-- ── User & Workspace Management ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id              TEXT PRIMARY KEY,           -- UUID v4
    email           TEXT UNIQUE NOT NULL,
    display_name    TEXT NOT NULL,
    avatar_url      TEXT,
    role            TEXT NOT NULL DEFAULT 'member'  -- 'admin', 'member', 'viewer'
        CHECK (role IN ('admin', 'member', 'viewer')),
    auth_provider   TEXT NOT NULL DEFAULT 'email'   -- 'email', 'google', 'github', 'sso'
        CHECK (auth_provider IN ('email', 'google', 'github', 'sso')),
    auth_provider_id TEXT,                      -- ID from the auth provider
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    last_login_at   TEXT,
    deleted_at      TEXT                        -- Soft delete
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- Workspaces (organizations/teams)
CREATE TABLE IF NOT EXISTS workspaces (
    id              TEXT PRIMARY KEY,           -- UUID v4
    name            TEXT NOT NULL,
    slug            TEXT UNIQUE NOT NULL,       -- URL-friendly identifier
    description     TEXT,
    logo_url        TEXT,
    owner_id        TEXT NOT NULL REFERENCES users(id),
    tier            TEXT NOT NULL DEFAULT 'free'   -- 'free', 'pro', 'enterprise'
        CHECK (tier IN ('free', 'pro', 'enterprise')),
    max_seats       INTEGER NOT NULL DEFAULT 5,
    max_connections INTEGER NOT NULL DEFAULT 2,
    settings        TEXT DEFAULT '{}',          -- JSON blob for workspace settings
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    deleted_at      TEXT
);

CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);

-- Workspace membership (join table with role)
CREATE TABLE IF NOT EXISTS workspace_members (
    id              TEXT PRIMARY KEY,           -- UUID v4
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
    user_id         TEXT NOT NULL REFERENCES users(id),
    role            TEXT NOT NULL DEFAULT 'member'
        CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    joined_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    invited_by      TEXT REFERENCES users(id),
    deleted_at      TEXT,
    UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_ws ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

-- API keys for programmatic access
CREATE TABLE IF NOT EXISTS api_keys (
    id              TEXT PRIMARY KEY,           -- UUID v4
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
    name            TEXT NOT NULL,
    key_hash        TEXT UNIQUE NOT NULL,       -- Hashed API key (store hash, not raw key)
    key_prefix      TEXT NOT NULL,              -- First 8 chars for identification (e.g., 'af_abc123...')
    created_by      TEXT NOT NULL REFERENCES users(id),
    last_used_at    TEXT,
    expires_at      TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    permissions     TEXT DEFAULT '["query"]',   -- JSON array of allowed permissions
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    deleted_at      TEXT
);

CREATE INDEX idx_api_keys_workspace ON api_keys(workspace_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- ── Database Connections ──────────────────────────────────────────────────

-- Supported database engines
CREATE TABLE IF NOT EXISTS db_engines (
    id              TEXT PRIMARY KEY,           -- e.g., 'postgresql', 'snowflake', 'bigquery', 'mysql', 'sqlite'
    name            TEXT UNIQUE NOT NULL,       -- Display name
    driver          TEXT NOT NULL,              -- SQLAlchemy driver name
    default_port    INTEGER,
    jdbc_prefix     TEXT,                       -- JDBC connection prefix
    icon_url        TEXT,
    is_active       INTEGER NOT NULL DEFAULT 1,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- Seed supported engines
INSERT OR IGNORE INTO db_engines (id, name, driver, default_port, jdbc_prefix) VALUES
    ('postgresql',   'PostgreSQL',       'postgresql+psycopg2', 5432,  'jdbc:postgresql://'),
    ('mysql',        'MySQL',            'mysql+pymysql',       3306,  'jdbc:mysql://'),
    ('snowflake',    'Snowflake',        'snowflake',           443,   'jdbc:snowflake://'),
    ('bigquery',     'BigQuery',         'bigquery',            NULL,  NULL),
    ('sqlite',       'SQLite',           'sqlite',               NULL,  NULL),
    ('redshift',     'Amazon Redshift',  'redshift+psycopg2',   5439,  'jdbc:redshift://');

-- Saved database connections (credentials stored encrypted)
CREATE TABLE IF NOT EXISTS db_connections (
    id              TEXT PRIMARY KEY,           -- UUID v4
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
    name            TEXT NOT NULL,              -- User-friendly name
    description     TEXT,
    engine_id       TEXT NOT NULL REFERENCES db_engines(id),
    host            TEXT,
    port            INTEGER,
    database_name   TEXT,
    username        TEXT,
    -- Encrypted credentials (using app-level encryption key)
    password_enc    TEXT,                       -- AES-256-GCM encrypted
    extra_params    TEXT DEFAULT '{}',          -- JSON: extra connection params (SSL, etc.)
    -- Connection pooling
    max_connections INTEGER NOT NULL DEFAULT 5,
    connection_timeout INTEGER NOT NULL DEFAULT 30,
    -- Status
    is_active       INTEGER NOT NULL DEFAULT 1,
    is_shared       INTEGER NOT NULL DEFAULT 0, -- Can other workspace members use this?
    last_connected_at TEXT,
    error_count     INTEGER NOT NULL DEFAULT 0,
    created_by      TEXT NOT NULL REFERENCES users(id),
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    deleted_at      TEXT,
    UNIQUE(workspace_id, name)
);

CREATE INDEX idx_db_connections_workspace ON db_connections(workspace_id);
CREATE INDEX idx_db_connections_engine ON db_connections(engine_id);

-- Connection credentials for OAuth-based databases (e.g., BigQuery, Snowflake)
CREATE TABLE IF NOT EXISTS db_connection_oauth (
    id              TEXT PRIMARY KEY,
    connection_id   TEXT UNIQUE NOT NULL REFERENCES db_connections(id),
    provider        TEXT NOT NULL,              -- 'google', 'snowflake'
    access_token_enc TEXT NOT NULL,             -- Encrypted access token
    refresh_token_enc TEXT,                     -- Encrypted refresh token
    token_expires_at TEXT,
    scope           TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

-- ── Schema Cache ──────────────────────────────────────────────────────────

-- Cached database schema for rapid introspection
CREATE TABLE IF NOT EXISTS cached_schemas (
    id              TEXT PRIMARY KEY,           -- UUID v4
    connection_id   TEXT NOT NULL REFERENCES db_connections(id),
    schema_name     TEXT NOT NULL DEFAULT 'public',  -- e.g., 'public', 'dbt_schema'
    raw_schema_text TEXT,                       -- Full schema description string for LLM prompts
    table_count     INTEGER NOT NULL DEFAULT 0,
    size_bytes      INTEGER DEFAULT 0,
    last_introspected_at TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(connection_id, schema_name)
);

CREATE INDEX idx_cached_schemas_conn ON cached_schemas(connection_id);

-- Individual table metadata within cached schemas
CREATE TABLE IF NOT EXISTS cached_tables (
    id              TEXT PRIMARY KEY,           -- UUID v4
    schema_id       TEXT NOT NULL REFERENCES cached_schemas(id),
    table_name      TEXT NOT NULL,
    table_type      TEXT NOT NULL DEFAULT 'table'  -- 'table', 'view', 'materialized_view'
        CHECK (table_type IN ('table', 'view', 'materialized_view')),
    row_count_estimate INTEGER DEFAULT NULL,
    description     TEXT,                       -- Table comment/description from DB
    is_ai_disabled  INTEGER NOT NULL DEFAULT 0, -- Opt-out of AI training
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(schema_id, table_name)
);

CREATE INDEX idx_cached_tables_schema ON cached_tables(schema_id);

-- Column metadata within tables
CREATE TABLE IF NOT EXISTS cached_columns (
    id              TEXT PRIMARY KEY,           -- UUID v4
    table_id        TEXT NOT NULL REFERENCES cached_tables(id),
    column_name     TEXT NOT NULL,
    ordinal_position INTEGER NOT NULL,
    data_type       TEXT NOT NULL,              -- e.g., 'integer', 'varchar(255)', 'timestamp'
    is_nullable     INTEGER NOT NULL DEFAULT 1,
    is_primary_key  INTEGER NOT NULL DEFAULT 0,
    is_foreign_key  INTEGER NOT NULL DEFAULT 0,
    default_value   TEXT,
    max_length      INTEGER,
    numeric_precision INTEGER,
    numeric_scale   INTEGER,
    description     TEXT,                       -- Column comment/description
    foreign_key_ref TEXT,                       -- 'schema.table.column' for FKs
    sample_values   TEXT,                       -- JSON array of frequent values
    distinct_count  INTEGER,
    null_count      INTEGER,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(table_id, column_name)
);

CREATE INDEX idx_cached_columns_table ON cached_columns(table_id);
CREATE INDEX idx_cached_columns_name ON cached_columns(column_name);

-- Relationship metadata (foreign key relationships for join inference)
CREATE TABLE IF NOT EXISTS cached_relationships (
    id              TEXT PRIMARY KEY,
    table_id        TEXT NOT NULL REFERENCES cached_tables(id),
    column_id       TEXT NOT NULL REFERENCES cached_columns(id),
    referenced_table_id  TEXT NOT NULL REFERENCES cached_tables(id),
    referenced_column_id TEXT NOT NULL REFERENCES cached_columns(id),
    constraint_name TEXT,
    relationship_type TEXT NOT NULL DEFAULT 'foreign_key'
        CHECK (relationship_type IN ('foreign_key', 'manual', 'inferred')),
    confidence      REAL DEFAULT 1.0,           -- For AI-inferred relationships
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_cached_relationships_table ON cached_relationships(table_id);
CREATE INDEX idx_cached_relationships_ref ON cached_relationships(referenced_table_id);

-- ── Query History & Transformations ───────────────────────────────────────

-- Natural language query sessions
CREATE TABLE IF NOT EXISTS query_sessions (
    id              TEXT PRIMARY KEY,           -- UUID v4
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
    user_id         TEXT NOT NULL REFERENCES users(id),
    connection_id   TEXT REFERENCES db_connections(id),
    title           TEXT,                       -- Auto-generated or user-provided
    tags            TEXT DEFAULT '[]',          -- JSON array of tags
    is_saved        INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    deleted_at      TEXT
);

CREATE INDEX idx_query_sessions_workspace ON query_sessions(workspace_id);
CREATE INDEX idx_query_sessions_user ON query_sessions(user_id);

-- Individual queries within a session (one NL question → one SQL generation)
CREATE TABLE IF NOT EXISTS query_logs (
    id              TEXT PRIMARY KEY,           -- UUID v4
    session_id      TEXT NOT NULL REFERENCES query_sessions(id),
    user_id         TEXT NOT NULL REFERENCES users(id),

    -- Input
    natural_language TEXT NOT NULL,             -- Original user question

    -- Generated SQL
    generated_sql   TEXT,                       -- The generated SQL query
    final_sql       TEXT,                       -- User-edited version (null = used generated)
    sql_dialect     TEXT NOT NULL DEFAULT 'sqlite',
    explain_plan    TEXT,                       -- LLM's explanation of the query

    -- Execution results
    row_count       INTEGER,
    execution_time_ms INTEGER,
    error_message   TEXT,                       -- SQL execution error, if any
    was_successful  INTEGER NOT NULL DEFAULT 0,

    -- LLM metadata
    llm_provider    TEXT,                       -- 'openai', 'anthropic'
    llm_model       TEXT,
    prompt_tokens   INTEGER DEFAULT 0,
    completion_tokens INTEGER DEFAULT 0,
    total_tokens    INTEGER DEFAULT 0,
    latency_ms      INTEGER,

    -- User feedback
    user_rating     INTEGER,                    -- 1-5 star rating
    user_edited     INTEGER NOT NULL DEFAULT 0, -- Did user edit the SQL?
    user_feedback   TEXT,                       -- Free-text feedback

    -- Additional context
    context_schema  TEXT,                       -- Schema used for this query (snapshot)
    referenced_tables TEXT DEFAULT '[]',        -- JSON array of table names referenced
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_query_logs_session ON query_logs(session_id);
CREATE INDEX idx_query_logs_user ON query_logs(user_id);
CREATE INDEX idx_query_logs_created ON query_logs(created_at);
CREATE INDEX idx_query_logs_success ON query_logs(was_successful);

-- Inline query comments/annotations
CREATE TABLE IF NOT EXISTS query_annotations (
    id              TEXT PRIMARY KEY,
    query_id        TEXT NOT NULL REFERENCES query_logs(id),
    user_id         TEXT NOT NULL REFERENCES users(id),
    annotation_type TEXT NOT NULL                -- 'comment', 'correction', 'explanation'
        CHECK (annotation_type IN ('comment', 'correction', 'explanation')),
    content         TEXT NOT NULL,
    position_start  INTEGER,                    -- Character position in SQL for inline annotations
    position_end    INTEGER,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_query_annotations_query ON query_annotations(query_id);

-- Data cleaning transformation logs
CREATE TABLE IF NOT EXISTS transformation_logs (
    id              TEXT PRIMARY KEY,           -- UUID v4
    query_id        TEXT REFERENCES query_logs(id),
    user_id         TEXT NOT NULL REFERENCES users(id),
    connection_id   TEXT REFERENCES db_connections(id),
    source_table    TEXT NOT NULL,              -- Table being cleaned
    operation_type  TEXT NOT NULL               -- 'drop_duplicates', 'fill_null', 'convert_type',
        CHECK (operation_type IN (               -- 'remove_outliers', 'rename_column',
            'drop_duplicates', 'fill_null',      -- 'filter_rows', 'aggregate',
            'convert_type', 'remove_outliers',   -- 'custom_sql'
            'rename_column', 'filter_rows',
            'aggregate', 'custom_sql'
        )),
    operation_config TEXT NOT NULL DEFAULT '{}', -- JSON: parameters for the operation
    affected_rows   INTEGER,
    undo_available  INTEGER NOT NULL DEFAULT 1,
    executed_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_transformation_logs_query ON transformation_logs(query_id);

-- ── Dashboards & Charts ──────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS dashboards (
    id              TEXT PRIMARY KEY,           -- UUID v4
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
    user_id         TEXT NOT NULL REFERENCES users(id),
    name            TEXT NOT NULL,
    description     TEXT,
    layout          TEXT DEFAULT '{}',          -- JSON: grid layout config
    is_public       INTEGER NOT NULL DEFAULT 0,
    share_token     TEXT UNIQUE,                -- For public sharing links
    tags            TEXT DEFAULT '[]',
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    deleted_at      TEXT
);

CREATE INDEX idx_dashboards_workspace ON dashboards(workspace_id);
CREATE INDEX idx_dashboards_user ON dashboards(user_id);

-- Charts / Visualizations (belong to a dashboard or standalone)
CREATE TABLE IF NOT EXISTS charts (
    id              TEXT PRIMARY KEY,           -- UUID v4
    dashboard_id    TEXT REFERENCES dashboards(id),
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
    user_id         TEXT NOT NULL REFERENCES users(id),
    name            TEXT NOT NULL,
    description     TEXT,
    chart_type      TEXT NOT NULL               -- 'bar', 'line', 'pie', 'scatter', 'heatmap',
        CHECK (chart_type IN (                   -- 'table', 'area', 'histogram', 'box', 'map'
            'bar', 'line', 'pie', 'scatter',
            'heatmap', 'table', 'area',
            'histogram', 'box', 'map', 'custom'
        )),

    -- Data source
    connection_id   TEXT REFERENCES db_connections(id),
    source_query_id TEXT REFERENCES query_logs(id),
    custom_sql      TEXT,                       -- For manual SQL

    -- Configuration
    config          TEXT DEFAULT '{}',          -- JSON: axes, colors, legend, etc.
    filters         TEXT DEFAULT '[]',          -- JSON array of filter definitions
    refresh_interval INTEGER,                   -- Auto-refresh in seconds (null = manual)

    -- Position in dashboard
    layout_x        INTEGER DEFAULT 0,
    layout_y        INTEGER DEFAULT 0,
    layout_w        INTEGER DEFAULT 6,
    layout_h        INTEGER DEFAULT 4,

    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    deleted_at      TEXT
);

CREATE INDEX idx_charts_dashboard ON charts(dashboard_id);
CREATE INDEX idx_charts_workspace ON charts(workspace_id);
CREATE INDEX idx_charts_user ON charts(user_id);

-- ── AI Training Data (for fine-tuning and RAG) ────────────────────────────

-- Training pairs for the text-to-SQL model
CREATE TABLE IF NOT EXISTS training_examples (
    id              TEXT PRIMARY KEY,
    workspace_id    TEXT REFERENCES workspaces(id),
    user_id         TEXT REFERENCES users(id),
    natural_language TEXT NOT NULL,
    sql_query       TEXT NOT NULL,
    dialect         TEXT NOT NULL DEFAULT 'sqlite',
    schema_context  TEXT,                       -- Schema snapshot used
    source          TEXT NOT NULL DEFAULT 'manual'  -- 'manual', 'curated', 'user_approved'
        CHECK (source IN ('manual', 'curated', 'user_approved', 'auto_generated')),
    quality_score   REAL,                       -- 0.0 - 1.0 quality rating
    is_active       INTEGER NOT NULL DEFAULT 1,
    used_count      INTEGER NOT NULL DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_training_examples_ws ON training_examples(workspace_id);

-- ── Usage & Analytics ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usage_events (
    id              TEXT PRIMARY KEY,
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
    user_id         TEXT REFERENCES users(id),
    event_type      TEXT NOT NULL,              -- 'query_generated', 'query_executed',
        CHECK (event_type IN (                   -- 'query_edited', 'chart_created',
            'query_generated', 'query_executed',  -- 'dashboard_shared', 'cleaning_applied',
            'query_edited', 'chart_created',      -- 'connection_added', 'export'
            'dashboard_shared', 'cleaning_applied',
            'connection_added', 'export',
            'api_call', 'login', 'error'
        )),
    event_data      TEXT DEFAULT '{}',          -- Event-specific payload
    ip_address      TEXT,
    user_agent      TEXT,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);

CREATE INDEX idx_usage_events_ws ON usage_events(workspace_id);
CREATE INDEX idx_usage_events_user ON usage_events(user_id);
CREATE INDEX idx_usage_events_type ON usage_events(event_type);
CREATE INDEX idx_usage_events_created ON usage_events(created_at);

-- Monthly usage aggregation (for billing and quotas)
CREATE TABLE IF NOT EXISTS monthly_usage (
    id              TEXT PRIMARY KEY,
    workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
    year_month      TEXT NOT NULL,              -- '2026-06'
    query_count     INTEGER NOT NULL DEFAULT 0,
    token_count     INTEGER NOT NULL DEFAULT 0,
    storage_bytes   INTEGER DEFAULT 0,
    unique_users    INTEGER DEFAULT 0,
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    UNIQUE(workspace_id, year_month)
);

CREATE INDEX idx_monthly_usage_ws ON monthly_usage(workspace_id);

-- ── Schema Migrations Tracking ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS schema_migrations (
    version         TEXT PRIMARY KEY,           -- Migration version/timestamp
    description     TEXT NOT NULL,
    applied_by      TEXT NOT NULL,
    applied_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    checksum        TEXT,                       -- For integrity verification
    duration_ms     INTEGER
);

-- ============================================================================
-- Triggers for automatic updated_at timestamps
-- ============================================================================

CREATE TRIGGER IF NOT EXISTS trg_users_updated
    AFTER UPDATE ON users
    FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_workspaces_updated
    AFTER UPDATE ON workspaces
    FOR EACH ROW
BEGIN
    UPDATE workspaces SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
    WHERE id = OLD.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_db_connections_updated
    AFTER UPDATE ON db_connections
    FOR EACH ROW
BEGIN
    UPDATE db_connections SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now')
    WHERE id = OLD.id;
END;

-- ============================================================================
-- Schema documentation table
-- ============================================================================

CREATE TABLE IF NOT EXISTS schema_docs (
    id              TEXT PRIMARY KEY,
    table_name      TEXT NOT NULL,
    column_name     TEXT,
    description     TEXT NOT NULL,
    example         TEXT,
    category        TEXT,                       -- 'business', 'technical', 'deprecated'
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
