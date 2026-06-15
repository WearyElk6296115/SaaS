import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import QueryEditor from "../components/QueryEditor";
import ResultsTable from "../components/ResultsTable";

function Home() {
  const [sql, setSql] = useState<string>("");
  const [question, setQuestion] = useState<string>("");

  const { data: health } = useQuery({
    queryKey: ["health"],
    queryFn: api.health,
  });

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          AnalystFlow
        </h2>
        <p className="text-gray-600">
          AI-powered co-pilot for data analysts. Ask questions in plain English
          and get SQL queries, cleaned data, and visualizations in seconds.
        </p>
        {health && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            <span className="text-green-700 font-medium">Connected</span>
            <span className="text-gray-400">v{health.version}</span>
          </div>
        )}
      </div>

      {/* Query Input */}
      <div className="card">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ask a question about your data
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='e.g., "Show me total sales by region for last quarter"'
            className="input flex-1"
          />
          <button
            onClick={() => {
              // TODO: Generate SQL
            }}
            disabled={!question.trim()}
            className="btn-primary"
          >
            Generate SQL
          </button>
        </div>
      </div>

      {/* SQL Editor */}
      <QueryEditor value={sql} onChange={setSql} />

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button className="btn-primary" disabled={!sql.trim()}>
          Run Query
        </button>
        <button className="btn-secondary" disabled={!sql.trim()}>
          Visualize
        </button>
        <button className="btn-secondary" disabled={!sql.trim()}>
          Clean Data
        </button>
      </div>

      {/* Results */}
      <ResultsTable columns={[]} rows={[]} />

      {/* Getting Started Guide */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-3">Getting Started</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-brand-50 rounded-lg">
            <div className="text-brand-600 font-semibold mb-1">1. Connect</div>
            <p className="text-sm text-gray-600">
              Connect to your database in Settings, or use the built-in sample
              database.
            </p>
          </div>
          <div className="p-4 bg-brand-50 rounded-lg">
            <div className="text-brand-600 font-semibold mb-1">2. Ask</div>
            <p className="text-sm text-gray-600">
              Type a question in plain English. AnalystFlow generates the SQL
              automatically.
            </p>
          </div>
          <div className="p-4 bg-brand-50 rounded-lg">
            <div className="text-brand-600 font-semibold mb-1">3. Explore</div>
            <p className="text-sm text-gray-600">
              Run queries, visualize results, and get data cleaning
              recommendations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;