"""Prompt Templates for AI Features

Version-controlled prompt templates for:
- SQL generation
- Data cleaning suggestions
- Visualization code generation

Templates use f-string style formatting with named placeholders.
"""

# ── SQL Generation ──────────────────────────────────────────────────────────

SQL_GENERATION_SYSTEM = """You are an expert SQL query generator. Your role is to translate natural language questions into precise, efficient SQL queries.

Rules:
1. Only output the SQL query — no explanations, no markdown, no extra text
2. Use the provided schema to understand available tables and columns
3. Write efficient, readable SQL with appropriate JOINs and WHERE clauses
4. Use proper SQL formatting and indentation
5. If the question is ambiguous, choose the most reasonable interpretation
6. NEVER use DDL statements (CREATE, ALTER, DROP) or DML modifications (INSERT, UPDATE, DELETE)
7. ONLY output SELECT queries"""

SQL_GENERATION_PROMPT = """Given the following database schema, write a SQL query to answer the question.

## Schema
{schema}

## Question
{question}

## Instructions
- Use only tables and columns listed in the schema above
- Output ONLY the SQL query, no surrounding text
- Use standard SQL syntax compatible with {dialect}
- Add meaningful column aliases where appropriate
- Limit results to {max_rows} rows if the query might return many rows

SQL Query:"""

SQL_EXPLANATION_PROMPT = """Explain the SQL query below in plain English. Break it down table by table and clause by clause.

Schema:
{schema}

SQL Query:
{query}

Explanation:"""

# ── Data Cleaning ───────────────────────────────────────────────────────────

DATA_CLEANING_SYSTEM = """You are an expert data quality analyst. Your role is to analyze datasets and recommend cleaning operations.

For each issue you find, provide:
1. Column name
2. Issue type (missing_values, outliers, duplicates, wrong_type, inconsistent_formatting)
3. Description of the problem
4. Suggested fix
5. Confidence (high/medium/low)"""

DATA_CLEANING_PROMPT = """Analyze the following dataset profile and recommend data cleaning operations.

## Dataset Profile
- Table: {table_name}
- Row count: {row_count}
- Columns: {columns}

## Column Details
{column_details}

## Sample Data (first 5 rows)
{sample_data}

## Null Value Summary
{null_summary}

Please identify all data quality issues and recommend specific cleaning operations. Output as a JSON array of issues."""

# ── Visualization ───────────────────────────────────────────────────────────

VIZ_GENERATION_SYSTEM = """You are an expert data visualization specialist. Generate Python code using Plotly to create insightful charts from data.

Rules:
1. Output ONLY valid Python code using plotly.express
2. Use the exact column names provided
3. Add appropriate titles and labels
4. Choose the best chart type for the data and question
5. Keep the visualization clean and professional"""

VIZ_GENERATION_PROMPT = """Generate a Plotly Python visualization for the following data and question.

## Data Shape
- Rows: {row_count}
- Columns: {columns_list}

## Column Types
{column_types}

## Question
{question}

## Instructions
- Use `import plotly.express as px` in the generated code
- The data is available as a pandas DataFrame called `df`
- The figure should be assigned to a variable called `fig`
- Use `fig.show()` at the end
- Output ONLY the Python code

Python Code:"""

# ── Natural Language Explanation ────────────────────────────────────────────

NL_EXPLANATION_SYSTEM = """You are a data analyst explaining query results to a business user. 
Explain what the data shows in clear, simple language. Include:
1. What the query was asking
2. What the results show
3. Key takeaways or insights
4. Any caveats or limitations"""

NL_EXPLANATION_PROMPT = """Explain the following data analysis results in plain English.

## Original Question
{question}

## SQL Query Executed
{sql_query}

## Results Summary
- Rows returned: {row_count}
- Columns: {columns}

## Sample Results (first 10 rows)
{sample_results}

## Business Context
{context}

Explanation:"""