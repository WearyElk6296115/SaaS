import { useState } from "react";
import { AlertTriangle, CheckCircle, Eye, Play, Undo2, Code, Sparkles, ChevronDown } from "lucide-react";

interface Anomaly {
  id: string;
  type: string;
  column: string;
  description: string;
  count: number;
  percentage: number;
  severity: "high" | "medium" | "low";
}

interface Recipe {
  id: string;
  title: string;
  description: string;
  column: string;
  type: string;
}

const sampleAnomalies: Anomaly[] = [
  { id: "a1", type: "missing_values", column: "customer_age", description: "Missing values detected", count: 142, percentage: 4.2, severity: "high" },
  { id: "a2", type: "inconsistent_formatting", column: "created_at", description: "Inconsistent date formats", count: 89, percentage: 2.6, severity: "medium" },
  { id: "a3", type: "outliers", column: "revenue", description: "Values exceed 3σ threshold", count: 23, percentage: 0.7, severity: "medium" },
  { id: "a4", type: "duplicates", column: "email", description: "Duplicate email addresses", count: 5, percentage: 0.15, severity: "low" },
];

const sampleRecipes: Recipe[] = [
  { id: "r1", title: "Impute Missing Values", description: "Fill 142 null values in `customer_age` using the median (34.1)", column: "customer_age", type: "fill_null" },
  { id: "r2", title: "Standardize Date Format", description: "Convert 89 dates in `created_at` to ISO 8601 format", column: "created_at", type: "convert_type" },
  { id: "r3", title: "Remove Outliers", description: "Remove 23 outlier values in `revenue` outside 3σ range", column: "revenue", type: "remove_outliers" },
  { id: "r4", title: "Remove Duplicates", description: "Remove 5 duplicate rows based on `email`", column: "email", type: "drop_duplicates" },
];

const sampleColumns = ["customer_name", "customer_age", "email", "revenue", "created_at", "region"];
const sampleRows = [
  ["Alice Johnson", 34, "alice@example.com", 1200, "2026-01-15", "North"],
  ["Bob Smith", null, "bob@example.com", 3400, "2026/01/20", "South"],
  ["Carol Davis", 28, "carol@example.com", null, "2026-02-01", "East"],
  ["Bob Smith", 45, "bob@example.com", 3400, "2026/01/20", "South"],
  ["Eve Wilson", 52, "eve@example.com", 8900, "2026-02-15", "West"],
];

export default function CleanCanvas() {
  const [previewRecipe, setPreviewRecipe] = useState<Recipe | null>(null);
  const [appliedRecipes, setAppliedRecipes] = useState<string[]>([]);
  const [showCode, setShowCode] = useState(false);

  const stats = {
    totalRows: 15204,
    anomalies: sampleAnomalies.reduce((s, a) => s + a.count, 0),
    progress: Math.round((appliedRecipes.length / sampleRecipes.length) * 100),
  };

  return (
    <div className="h-full flex flex-col">
      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6 text-sm">
          <span className="text-gray-500">
            Total Rows: <strong className="text-gray-900">{stats.totalRows.toLocaleString()}</strong>
          </span>
          <span className="text-gray-500">
            Anomalies Detected: <strong className="text-rose-600">{stats.anomalies}</strong>
          </span>
          <span className="text-gray-500">
            Progress: <strong className="text-emerald-600">{stats.progress}%</strong>
          </span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Sparkles className="w-4 h-4" />
          Auto-Clean (AI)
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Area */}
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    {sampleColumns.map((col) => (
                      <th key={col} className="px-4 py-3 text-left">
                        <div className="text-xs font-medium text-gray-500 uppercase">{col}</div>
                        {/* Mini profile bar */}
                        <div className="mt-1 flex items-center gap-2">
                          <div className="h-1.5 bg-gray-200 rounded-full flex-1 max-w-[100px]">
                            <div
                              className={`h-full rounded-full ${
                                col === "customer_age" || col === "revenue"
                                  ? "w-3/4 bg-rose-400"
                                  : col === "created_at"
                                  ? "w-1/2 bg-amber-400"
                                  : "w-full bg-emerald-400"
                              }`}
                            />
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {col === "customer_age" && "4.2% null"}
                            {col === "revenue" && "0.7% outlier"}
                            {col === "created_at" && "2.6% mixed"}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sampleRows.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      {row.map((cell, j) => {
                        const isDirty =
                          (sampleColumns[j] === "customer_age" && cell === null) ||
                          (sampleColumns[j] === "revenue" && cell === null) ||
                          (sampleColumns[j] === "created_at" && typeof cell === "string" && cell.includes("/"));
                        return (
                          <td
                            key={j}
                            className={`px-4 py-2.5 text-sm ${
                              isDirty ? "bg-rose-50 border-b-2 border-rose-300" : "text-gray-700"
                            }`}
                          >
                            {cell === null ? (
                              <span className="text-rose-400 italic">NULL</span>
                            ) : (
                              typeof cell === "number" ? cell.toLocaleString() : cell
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Panel: Anomaly Center */}
        <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Anomaly Center
            </h3>
          </div>

          <div className="p-3 space-y-2">
            {sampleAnomalies.map((anomaly) => (
              <div key={anomaly.id} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="p-3">
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-medium text-gray-900">{anomaly.column}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                      anomaly.severity === "high" ? "bg-rose-100 text-rose-700" :
                      anomaly.severity === "medium" ? "bg-amber-100 text-amber-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>{anomaly.severity}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{anomaly.description} ({anomaly.count} rows)</p>

                  {/* Recipe Card */}
                  {sampleRecipes.filter(r => r.column === anomaly.column).map(recipe => (
                    <div key={recipe.id} className="bg-gray-50 rounded-lg p-2.5 mt-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-medium text-gray-800">{recipe.title}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{recipe.description}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => setPreviewRecipe(recipe)}
                            className="p-1.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setAppliedRecipes(prev => [...prev, recipe.id])}
                            className="p-1.5 rounded hover:bg-emerald-100 text-gray-400 hover:text-emerald-600"
                            title="Apply"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Transformation History */}
      <div className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowCode(!showCode)} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100">
            <Code className="w-3.5 h-3.5" /> {showCode ? "Hide Code" : "View Code"}
          </button>
          <div className="flex-1 flex items-center gap-3 ml-4">
            {appliedRecipes.length === 0 ? (
              <span className="text-xs text-gray-400">No transformations applied yet</span>
            ) : (
              appliedRecipes.map((rid, i) => {
                const recipe = sampleRecipes.find(r => r.id === rid);
                return (
                  <div key={rid} className="flex items-center gap-2 text-xs">
                    {i > 0 && <ChevronDown className="w-3 h-3 text-gray-300 -rotate-90" />}
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md font-medium">
                      {recipe?.title}
                    </span>
                    <button className="text-gray-300 hover:text-rose-500">
                      <Undo2 className="w-3 h-3" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setPreviewRecipe(null)}>
          <div className="bg-white rounded-xl shadow-xl w-[640px] max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Previewing: {previewRecipe.title}</h3>
              <p className="text-sm text-gray-500 mt-1">on `{previewRecipe.column}`</p>
            </div>
            <div className="p-5">
              <div className="flex gap-6">
                <div className="flex-1">
                  <p className="text-xs font-medium text-rose-600 mb-2">Before</p>
                  <div className="h-32 bg-rose-50 rounded-lg flex items-end justify-center gap-2 px-4 pb-4">
                    <div className="w-8 bg-rose-300 rounded-t" style={{height: "80%"}} />
                    <div className="w-8 bg-rose-400 rounded-t" style={{height: "100%"}} />
                    <div className="w-8 bg-rose-300 rounded-t" style={{height: "60%"}} />
                    <div className="w-8 bg-gray-300 rounded-t" style={{height: "90%"}} title="NULL" />
                    <div className="w-8 bg-rose-300 rounded-t" style={{height: "70%"}} />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-emerald-600 mb-2">After</p>
                  <div className="h-32 bg-emerald-50 rounded-lg flex items-end justify-center gap-2 px-4 pb-4">
                    <div className="w-8 bg-emerald-300 rounded-t" style={{height: "80%"}} />
                    <div className="w-8 bg-emerald-400 rounded-t" style={{height: "100%"}} />
                    <div className="w-8 bg-emerald-300 rounded-t" style={{height: "60%"}} />
                    <div className="w-8 bg-emerald-300 rounded-t" style={{height: "88%"}} />
                    <div className="w-8 bg-emerald-300 rounded-t" style={{height: "70%"}} />
                  </div>
                </div>
              </div>
              <div className="flex gap-6 mt-4 text-sm">
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">Mean:</span><span className="font-mono">32.4</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Nulls:</span><span className="font-mono text-rose-600">142</span></div>
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">Mean:</span><span className="font-mono">34.1</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Nulls:</span><span className="font-mono text-emerald-600">0</span></div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end gap-2">
              <button onClick={() => setPreviewRecipe(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
              <button onClick={() => { setAppliedRecipes(prev => [...prev, previewRecipe.id]); setPreviewRecipe(null); }} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg">Confirm & Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}