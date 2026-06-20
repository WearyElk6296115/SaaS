"""Local Database Initialization

Creates and manages the AnalystFlow local metadata database
(analystflow.db) which stores schema caches, connection metadata,
query history, and other internal data.
"""

import uuid
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import create_engine, text, inspect as sa_inspect
from sqlalchemy.engine import Engine

from app.config import settings


def get_engine() -> Engine:
    """Get the local metadata database engine."""
    return create_engine(settings.DATABASE_URL)


def init_local_database():
    """Initialize the local metadata database with required tables.
    This runs the schema DDL from the designed DATABASE_SCHEMA.sql.
    """
    engine = get_engine()
    
    # Check if already initialized
    inspector = sa_inspect(engine)
    existing_tables = inspector.get_table_names()
    
    if "db_engines" in existing_tables:
        return  # Already initialized
    
    # Create the metadata tables
    with engine.begin() as conn:
        # ── User & Workspace Management ───────────────────────
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS users (
                id              TEXT PRIMARY KEY,
                email           TEXT UNIQUE NOT NULL,
                display_name    TEXT NOT NULL,
                avatar_url      TEXT,
                role            TEXT NOT NULL DEFAULT 'member'
                    CHECK (role IN ('admin', 'member', 'viewer')),
                auth_provider   TEXT NOT NULL DEFAULT 'email'
                    CHECK (auth_provider IN ('email', 'google', 'github', 'sso')),
                auth_provider_id TEXT,
                created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                last_login_at   TEXT,
                deleted_at      TEXT
            )
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS workspaces (
                id              TEXT PRIMARY KEY,
                name            TEXT NOT NULL,
                slug            TEXT UNIQUE NOT NULL,
                description     TEXT,
                logo_url        TEXT,
                owner_id        TEXT NOT NULL REFERENCES users(id),
                tier            TEXT NOT NULL DEFAULT 'free'
                    CHECK (tier IN ('free', 'pro', 'enterprise')),
                max_seats       INTEGER NOT NULL DEFAULT 5,
                max_connections INTEGER NOT NULL DEFAULT 2,
                settings        TEXT DEFAULT '{}',
                created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                deleted_at      TEXT
            )
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS workspace_members (
                id              TEXT PRIMARY KEY,
                workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
                user_id         TEXT NOT NULL REFERENCES users(id),
                role            TEXT NOT NULL DEFAULT 'member'
                    CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
                joined_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                invited_by      TEXT REFERENCES users(id),
                deleted_at      TEXT,
                UNIQUE(workspace_id, user_id)
            )
        """))
        
        # ── Database Engines & Connections ────────────────────
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS db_engines (
                id              TEXT PRIMARY KEY,
                name            TEXT UNIQUE NOT NULL,
                driver          TEXT NOT NULL,
                default_port    INTEGER,
                jdbc_prefix     TEXT,
                icon_url        TEXT,
                is_active       INTEGER NOT NULL DEFAULT 1,
                created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
            )
        """))
        
        # Seed supported engines
        engines_data = [
            ('postgresql', 'PostgreSQL', 'postgresql+psycopg2', 5432, 'jdbc:postgresql://'),
            ('mysql', 'MySQL', 'mysql+pymysql', 3306, 'jdbc:mysql://'),
            ('snowflake', 'Snowflake', 'snowflake', 443, 'jdbc:snowflake://'),
            ('bigquery', 'BigQuery', 'bigquery', None, None),
            ('sqlite', 'SQLite', 'sqlite', None, None),
            ('redshift', 'Amazon Redshift', 'redshift+psycopg2', 5439, 'jdbc:redshift://'),
        ]
        for eng_id, name, driver, port, jdbc in engines_data:
            conn.execute(
                text("""INSERT OR IGNORE INTO db_engines (id, name, driver, default_port, jdbc_prefix)
                       VALUES (:id, :name, :driver, :port, :jdbc)"""),
                {"id": eng_id, "name": name, "driver": driver, "port": port, "jdbc": jdbc}
            )
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS db_connections (
                id              TEXT PRIMARY KEY,
                workspace_id    TEXT NOT NULL REFERENCES workspaces(id),
                name            TEXT NOT NULL,
                description     TEXT,
                engine_id       TEXT NOT NULL REFERENCES db_engines(id),
                host            TEXT,
                port            INTEGER,
                database_name   TEXT,
                username        TEXT,
                password_enc    TEXT,
                extra_params    TEXT DEFAULT '{}',
                max_connections INTEGER NOT NULL DEFAULT 5,
                connection_timeout INTEGER NOT NULL DEFAULT 30,
                is_active       INTEGER NOT NULL DEFAULT 1,
                is_shared       INTEGER NOT NULL DEFAULT 0,
                last_connected_at TEXT,
                error_count     INTEGER NOT NULL DEFAULT 0,
                created_by      TEXT NOT NULL REFERENCES users(id),
                created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                deleted_at      TEXT,
                UNIQUE(workspace_id, name)
            )
        """))
        
        # ── Schema Cache ──────────────────────────────────────
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS cached_schemas (
                id              TEXT PRIMARY KEY,
                connection_id   TEXT NOT NULL REFERENCES db_connections(id),
                schema_name     TEXT NOT NULL DEFAULT 'public',
                raw_schema_text TEXT,
                table_count     INTEGER NOT NULL DEFAULT 0,
                size_bytes      INTEGER DEFAULT 0,
                last_introspected_at TEXT,
                created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                UNIQUE(connection_id, schema_name)
            )
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS cached_tables (
                id              TEXT PRIMARY KEY,
                schema_id       TEXT NOT NULL REFERENCES cached_schemas(id),
                table_name      TEXT NOT NULL,
                table_type      TEXT NOT NULL DEFAULT 'table'
                    CHECK (table_type IN ('table', 'view', 'materialized_view')),
                row_count_estimate INTEGER DEFAULT NULL,
                description     TEXT,
                is_ai_disabled  INTEGER NOT NULL DEFAULT 0,
                created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                UNIQUE(schema_id, table_name)
            )
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS cached_columns (
                id              TEXT PRIMARY KEY,
                table_id        TEXT NOT NULL REFERENCES cached_tables(id),
                column_name     TEXT NOT NULL,
                ordinal_position INTEGER NOT NULL,
                data_type       TEXT NOT NULL,
                is_nullable     INTEGER NOT NULL DEFAULT 1,
                is_primary_key  INTEGER NOT NULL DEFAULT 0,
                is_foreign_key  INTEGER NOT NULL DEFAULT 0,
                default_value   TEXT,
                max_length      INTEGER,
                numeric_precision INTEGER,
                numeric_scale   INTEGER,
                description     TEXT,
                foreign_key_ref TEXT,
                sample_values   TEXT,
                distinct_count  INTEGER,
                null_count      INTEGER,
                created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
                UNIQUE(table_id, column_name)
            )
        """))
        
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS cached_relationships (
                id              TEXT PRIMARY KEY,
                table_id        TEXT NOT NULL REFERENCES cached_tables(id),
                column_id       TEXT NOT NULL REFERENCES cached_columns(id),
                referenced_table_id  TEXT NOT NULL REFERENCES cached_tables(id),
                referenced_column_id TEXT NOT NULL REFERENCES cached_columns(id),
                constraint_name TEXT,
                relationship_type TEXT NOT NULL DEFAULT 'foreign_key'
                    CHECK (relationship_type IN ('foreign_key', 'manual', 'inferred')),
                confidence      REAL DEFAULT 1.0,
                created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
            )
        """))


def ensure_default_workspace() -> str:
    """Ensure a default workspace exists and return its ID."""
    engine = get_engine()
    with engine.begin() as conn:
        # Check if default user exists
        result = conn.execute(text("SELECT id FROM users LIMIT 1"))
        user_row = result.fetchone()
        
        if not user_row:
            user_id = str(uuid.uuid4())
            conn.execute(
                text("""INSERT INTO users (id, email, display_name, role)
                       VALUES (:id, :email, :name, :role)"""),
                {"id": user_id, "email": "default@analystflow.local",
                 "name": "Default User", "role": "admin"}
            )
        else:
            user_id = user_row[0]
        
        # Check if default workspace exists
        result = conn.execute(text("SELECT id FROM workspaces LIMIT 1"))
        ws_row = result.fetchone()
        
        if not ws_row:
            ws_id = str(uuid.uuid4())
            conn.execute(
                text("""INSERT INTO workspaces (id, name, slug, owner_id, tier, max_connections)
                       VALUES (:id, :name, :slug, :owner, :tier, :max_conn)"""),
                {"id": ws_id, "name": "Default Workspace",
                 "slug": "default", "owner": user_id,
                 "tier": "free", "max_conn": 5}
            )
            # Add owner as member
            conn.execute(
                text("""INSERT INTO workspace_members (id, workspace_id, user_id, role)
                       VALUES (:id, :ws_id, :user_id, :role)"""),
                {"id": str(uuid.uuid4()), "ws_id": ws_id,
                 "user_id": user_id, "role": "owner"}
            )
            return ws_id
        
        return ws_row[0]
