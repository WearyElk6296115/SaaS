"""Data Cleaning Engine

Analyzes datasets for quality issues and recommends cleaning operations.
Uses Pandas for analysis and the LLM for intelligent recommendations.
"""

from typing import Any
import pandas as pd


class CleaningIssue:
    """Represents a single data quality issue found in a dataset."""

    def __init__(
        self,
        column: str,
        issue_type: str,
        description: str,
        suggestion: str,
        confidence: str = "medium",
    ):
        self.column = column
        self.issue_type = issue_type  # missing_values, outliers, duplicates, wrong_type, inconsistent_formatting
        self.description = description
        self.suggestion = suggestion
        self.confidence = confidence

    def to_dict(self) -> dict:
        return {
            "column": self.column,
            "issue_type": self.issue_type,
            "description": self.description,
            "suggestion": self.suggestion,
            "confidence": self.confidence,
        }


class CleaningEngine:
    """Analyzes datasets and recommends/produces cleaned data."""

    def __init__(self):
        self.issues: list[CleaningIssue] = []

    def analyze(self, df: pd.DataFrame) -> list[CleaningIssue]:
        """Run automated analysis on a DataFrame to find quality issues."""
        self.issues = []

        # Check for missing values
        self._check_missing_values(df)

        # Check for duplicates
        self._check_duplicates(df)

        # Check data types
        self._check_dtypes(df)

        return self.issues

    def _check_missing_values(self, df: pd.DataFrame):
        """Find columns with missing values."""
        null_counts = df.isnull().sum()
        null_pct = (null_counts / len(df)) * 100

        for col in df.columns:
            pct = null_pct[col]
            if pct > 0:
                issue_type = "missing_values"
                if pct > 50:
                    suggestion = f"Consider dropping column '{col}' — {pct:.1f}% values are missing"
                elif pct > 20:
                    suggestion = f"Consider imputing with median/mode or dropping column '{col}'"
                else:
                    suggestion = f"Consider imputing missing values in '{col}' with median (numeric) or mode (categorical)"

                self.issues.append(CleaningIssue(
                    column=col,
                    issue_type=issue_type,
                    description=f"{pct:.1f}% of values in '{col}' are missing ({int(null_counts[col])} rows)",
                    suggestion=suggestion,
                    confidence="high" if pct > 20 else "medium",
                ))

    def _check_duplicates(self, df: pd.DataFrame):
        """Check for duplicate rows."""
        dup_count = df.duplicated().sum()
        if dup_count > 0:
            self.issues.append(CleaningIssue(
                column="(entire row)",
                issue_type="duplicates",
                description=f"Found {dup_count} duplicate rows ({dup_count/len(df)*100:.1f}% of data)",
                suggestion=f"Consider removing {dup_count} duplicate rows using df.drop_duplicates()",
                confidence="high",
            ))

    def _check_dtypes(self, df: pd.DataFrame):
        """Check for columns that might have wrong data types."""
        for col in df.columns:
            # Check if object column looks like it should be numeric
            if df[col].dtype == "object":
                numeric_count = pd.to_numeric(df[col], errors="coerce").notna().sum()
                if numeric_count > len(df) * 0.8:
                    self.issues.append(CleaningIssue(
                        column=col,
                        issue_type="wrong_type",
                        description=f"Column '{col}' is stored as text but {numeric_count}/{len(df)} values are numeric",
                        suggestion=f"Convert '{col}' to numeric type: pd.to_numeric(df['{col}'], errors='coerce')",
                        confidence="high",
                    ))

            # Check for date-like strings
            if df[col].dtype == "object" and df[col].nunique() > len(df) * 0.5:
                date_count = pd.to_datetime(df[col], errors="coerce").notna().sum()
                if date_count > len(df) * 0.8:
                    self.issues.append(CleaningIssue(
                        column=col,
                        issue_type="wrong_type",
                        description=f"Column '{col}' appears to contain dates but is stored as text",
                        suggestion=f"Convert '{col}' to datetime: pd.to_datetime(df['{col}'])",
                        confidence="high",
                    ))

    def build_dataset_profile(self, df: pd.DataFrame, table_name: str = "dataset") -> dict:
        """Build a profile dictionary for LLM-based cleaning analysis."""
        profile = {
            "table_name": table_name,
            "row_count": len(df),
            "columns": list(df.columns),
            "column_details": [],
            "sample_data": df.head(5).to_dict(orient="records"),
            "null_summary": {},
        }

        for col in df.columns:
            col_info = {
                "name": col,
                "dtype": str(df[col].dtype),
                "null_count": int(df[col].isnull().sum()),
                "null_pct": round(float(df[col].isnull().sum() / len(df) * 100), 1),
                "unique_values": int(df[col].nunique()),
            }

            if df[col].dtype in ("int64", "float64"):
                col_info["min"] = float(df[col].min()) if not df[col].isnull().all() else None
                col_info["max"] = float(df[col].max()) if not df[col].isnull().all() else None
                col_info["mean"] = float(df[col].mean()) if not df[col].isnull().all() else None

            profile["column_details"].append(col_info)
            profile["null_summary"][col] = {
                "count": int(df[col].isnull().sum()),
                "percentage": round(float(df[col].isnull().sum() / len(df) * 100), 1),
            }

        return profile