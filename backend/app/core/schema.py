"""Schema Introspection & Caching

Handles retrieving database schema information and caching it
to reduce LLM token usage and speed up response times.
"""

from typing import Optional
from sqlalchemy import inspect, MetaData, create_engine


class SchemaCache:
    """Caches database schema information to avoid repeated introspection."""

    def __init__(self, database_url: str):
        self.database_url = database_url
        self._engine = None
        self._cached_schema: Optional[str] = None

    def _get_engine(self):
        if self._engine is None:
            self._engine = create_engine(self.database_url)
        return self._engine

    def introspect_schema(self, force: bool = False) -> str:
        """Introspect the database and return a formatted schema string."""
        if self._cached_schema and not force:
            return self._cached_schema

        engine = self._get_engine()
        inspector = inspect(engine)
        schema_parts = []

        for table_name in inspector.get_table_names():
            columns = inspector.get_columns(table_name)
            pk_constraint = inspector.get_pk_constraint(table_name)
            fk_constraints = inspector.get_foreign_keys(table_name)

            col_lines = []
            for col in columns:
                nullable = "NULL" if col["nullable"] else "NOT NULL"
                default = f" DEFAULT {col['default']}" if col.get("default") is not None else ""
                col_lines.append(f"  - {col['name']} ({col['type']}) {nullable}{default}")

            pk_cols = pk_constraint.get("constrained_columns", [])
            if pk_cols:
                col_lines.append(f"  - PRIMARY KEY: {', '.join(pk_cols)}")

            for fk in fk_constraints:
                col_lines.append(
                    f"  - FOREIGN KEY: {', '.join(fk['constrained_columns'])} → "
                    f"{fk['referred_table']}({', '.join(fk['referred_columns'])})"
                )

            schema_parts.append(f"Table: {table_name}\n" + "\n".join(col_lines))

        self._cached_schema = "\n\n".join(schema_parts)
        return self._cached_schema

    def clear_cache(self):
        """Clear the cached schema."""
        self._cached_schema = None

    def get_table_names(self) -> list[str]:
        """Get list of table names from the database."""
        engine = self._get_engine()
        inspector = inspect(engine)
        return inspector.get_table_names()

    def get_table_columns(self, table_name: str) -> list[dict]:
        """Get column details for a specific table."""
        engine = self._get_engine()
        inspector = inspect(engine)
        return inspector.get_columns(table_name)