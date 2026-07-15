import { useState } from "react";
import { Sparkles, Play, Copy, Edit3, Download, Wand2, MessageSquare } from "lucide-react";
import QueryEditor from "../components/QueryEditor";
import ProfileDataTable from "../components/ProfileDataTable";

interface NotebookCell {
  id: string;
  type: "input" | "response";
  question?: string;
  explanation?: string;
  sql?: string;
  columns?: string[];
  rows?: unknown[][];
}

export default function Workspace() {
  const [activeTab, setActiveTab] = useState<"query" | "clean" | "visualize">("query");
  const [question, setQuestion] = useState("");
  const [cells, setCells] = useState<NotebookCell[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAsk = async () => {
    if (!question.trim() || isGenerating) return;

    setIsGenerating(true);
    const newCell: NotebookCell = {
      id: Date.now().toString(),
      type: "response",
      question: question,
      explanation: "I'm joining the `orders` and `regions` tables on `region_id`, filtering for `order_date` in the last 30 days, and summing the `total_amount`.",
      sql: `SELECT\n  r.region_name,\n  SUM(o.total_amount) AS revenue\nFROM orders o\nJOIN regions r ON o.region_id = r.id\nWHERE o.order_date >= DATEADD('day', -30, CURRENT_DATE)\nGROUP BY r.region_name\nORDER BY revenue DESC;`,
      columns: ["region_name", "revenue", "order_count", "avg_order_value"],
      rows: [
        ["North America", 284500, 1240, 229.44],
        ["Europe", 215300, 980, 219.69],
        ["Asia Pacific", 189200, 845, 223.91],
        ["Latin America", 98700, 420, 235.00],
        ["Middle East", 65400, 285, 229.47],
      ],
    };

    // Simulate AI delay
    await new Promise((r) => setTimeout(r, 1500));
    setCells((prev) => [...prev, newCell]);
    setQuestion("");
    setIsGenerating(false);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {(["query", "clean", "visualize"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab === "query" && <SquareTerminal className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab === "clean" && <Wand2 className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab === "visualize" && <BarChart3 className="w-3.5 h-3.5 inline mr-1.5" />}
              {tab === "query" ? "Query" : tab === "clean" ? "Clean" : "Visualize"}
            </button>
          ))}
        </div>
      </div>

      {/* Notebook Cells */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {cells.length === 0 && !isGenerating && (
          <div className="flex-1 flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-violet-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Ask anything about your data
              </h2>
              <p className="text-sm text-gray-500">
                Type a question in natural language and I'll generate the SQL, run it, and show you the results.
              </p>
            </div>
          </div>
        )}

        {cells.map((cell) => (
          <div key={cell.id} className="space-y-3">
            {/* Question Bubble */}
            <div className="flex justify-end">
              <div className="bg-indigo-600 text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-xl text-sm">
                {cell.question}
              </div>
            </div>

            {/* AI Response Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                </div>
                <span className="text-xs font-medium text-gray-500">
                  Generating SQL for:{" "}
                  <span className="text-gray-700">{cell.question}</span>
                </span>
              </div>

              {/* Explanation */}
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                <details className="group">
                  <summary className="text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700">
                    How this query works
                  </summary>
                  <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                    {cell.explanation}
                  </p>
                </details>
              </div>

              {/* SQL Editor */}
              <div className="border-b border-gray-100">
                <QueryEditor value={cell.sql || ""} onChange={() => {}} />
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border-t border-gray-100">
                  <button className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-200">
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 px-2 py-1 rounded hover:bg-gray-200">
                    <Edit3 className="w-3 h-3" /> Edit
                  </button>
                  <button className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 px-2 py-1 rounded hover:bg-emerald-50 ml-auto">
                    <Play className="w-3 h-3" /> Run
                  </button>
                </div>
              </div>

              {/* Results Table */}
              <ProfileDataTable columns={cell.columns || []} rows={cell.rows || []} />

              {/* Action Bar */}
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border-t border-gray-100">
                <button className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-lg hover:bg-gray-200">
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:text-violet-700 px-2.5 py-1.5 rounded-lg hover:bg-violet-50">
                  <Wand2 className="w-3.5 h-3.5" /> Add to Clean Canvas
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 hover:text-indigo-700 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 ml-auto">
                  <BarChart3 className="w-3.5 h-3.5" /> Quick Visualize
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* AI Loading */}
        {isGenerating && (
          <div className="flex items-center gap-3 px-4 py-3">
            <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-violet-600 animate-pulse" />
            </div>
            <span className="text-sm text-gray-500">Generating SQL...</span>
          </div>
        )}
      </div>

      {/* Sticky Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex gap-2 max-w-4xl">
          <div className="flex-1 relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
              placeholder="Ask a question about your data... (e.g., 'Show me revenue by region last month')"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500 text-sm"
            />
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500" />
          </div>
          <button
            onClick={handleAsk}
            disabled={!question.trim() || isGenerating}
            className="px-5 py-3 bg-violet-600 hover:bg-violet-700 disabled:bg-gray-300 text-white font-medium rounded-xl transition-colors text-sm flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Ask
          </button>
        </div>
      </div>
    </div>
  );
}

// Icons used inline
function SquareTerminal({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l6 6-6 6M12 18h6" />
    </svg>
  );
}

function BarChart3({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 20h18M5 16V9m7 7V4m7 13v-6" />
    </svg>
  );
}

function Wand2({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 7.5l9 9M3 12h1.5M12 3v1.5M21 12h-1.5M12 21v-1.5M5.636 5.636l1.06 1.06M18.364 18.364l-1.06 1.06M18.364 5.636l-1.06 1.06M5.636 18.364l1.06-1.06" />
    </svg>
  );
}