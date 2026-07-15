import { useState } from "react";
import { Database, Plus, Link, Unlink, RefreshCw, CheckCircle, XCircle, ChevronRight } from "lucide-react";

interface Connection {
  id: string;
  name: string;
  engine: string;
  host: string;
  database: string;
  status: "connected" | "disconnected" | "error";
  lastSync?: string;
}

const sampleConnections: Connection[] = [
  { id: "1", name: "Production DB", engine: "postgresql", host: "pg.example.com", database: "analytics_prod", status: "connected", lastSync: "2026-07-04T10:30:00Z" },
  { id: "2", name: "Snowflake Data Warehouse", engine: "snowflake", host: "xy12345.snowflakecomputing.com", database: "ANALYTICS_DB", status: "connected", lastSync: "2026-07-04T09:15:00Z" },
  { id: "3", name: "Staging MySQL", engine: "mysql", host: "staging.example.com", database: "analytics_staging", status: "error" },
];

const engineLogos: Record<string, string> = {
  postgresql: "🐘",
  snowflake: "❄️",
  mysql: "🐬",
  bigquery: "🔍",
  sqlite: "📁",
};

export default function Connections() {
  const [showAdd, setShowAdd] = useState(false);
  const [connections, setConnections] = useState(sampleConnections);

  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Database Connections</h2>
          <p className="text-sm text-gray-500 mt-1">Connect to your databases to start querying</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Connection
        </button>
      </div>

      {/* Add Connection Form */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Add New Connection</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Connection Name</label>
              <input type="text" placeholder="My Database" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Engine</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option>PostgreSQL</option>
                <option>Snowflake</option>
                <option>MySQL</option>
                <option>BigQuery</option>
                <option>SQLite</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Host</label>
              <input type="text" placeholder="localhost" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Port</label>
              <input type="number" placeholder="5432" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Database</label>
              <input type="text" placeholder="analytics_db" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Username</label>
              <input type="text" placeholder="admin" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
              <input type="password" placeholder="••••••••" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">Test & Save</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</button>
          </div>
        </div>
      )}

      {/* Connection List */}
      <div className="space-y-3">
        {connections.map((conn) => (
          <div key={conn.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-lg">
                  {engineLogos[conn.engine] || "🗄️"}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{conn.name}</h4>
                  <p className="text-xs text-gray-500 font-mono">{conn.host}/{conn.database}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  {conn.status === "connected" ? (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  ) : conn.status === "error" ? (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  ) : (
                    <Link className="w-4 h-4 text-gray-300" />
                  )}
                  <span className={`text-xs font-medium ${
                    conn.status === "connected" ? "text-emerald-600" :
                    conn.status === "error" ? "text-rose-600" : "text-gray-400"
                  }`}>
                    {conn.status === "connected" ? "Connected" :
                     conn.status === "error" ? "Error" : "Disconnected"}
                  </span>
                </div>
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-indigo-600" title="Sync Schema">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <ChevronRight className="w-4 h-4 text-gray-300" />
              </div>
            </div>
            {conn.lastSync && (
              <div className="mt-2 ml-14 text-[10px] text-gray-400">
                Last synced: {new Date(conn.lastSync).toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}