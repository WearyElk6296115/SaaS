import { useState } from "react";
import { Sparkles, Download, Share2, Settings2, Maximize2, ChevronRight, TrendingUp, BarChart3, PieChart, Dot } from "lucide-react";

type ChartType = "line" | "bar" | "scatter";

const chartRecommendations = [
  { type: "line" as ChartType, label: "Line Chart", recommended: true, icon: TrendingUp },
  { type: "bar" as ChartType, label: "Bar Chart", recommended: false, icon: BarChart3 },
  { type: "scatter" as ChartType, label: "Scatter Plot", recommended: false, icon: Dot },
];

export default function Visualize() {
  const [selectedChart, setSelectedChart] = useState<ChartType>("line");
  const [showCustomizer, setShowCustomizer] = useState(false);

  return (
    <div className="h-full flex flex-col">
      {/* Recommendation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider mr-2">Recommended</span>
          {chartRecommendations.map((rec) => {
            const Icon = rec.icon;
            return (
              <button
                key={rec.type}
                onClick={() => setSelectedChart(rec.type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedChart === rec.type
                    ? "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                {rec.label}
                {rec.recommended && (
                  <span className="text-[10px] bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full font-medium">AI</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Chart Area (70%) */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="bg-white rounded-xl border border-gray-200 h-full flex flex-col">
            <div className="flex-1 relative flex items-center justify-center p-8">
              {/* Placeholder Chart */}
              <div className="w-full h-full max-h-[400px] flex items-end justify-center gap-4 px-12">
                {selectedChart === "line" && (
                  <svg viewBox="0 0 400 200" className="w-full h-full">
                    <polyline points="20,180 80,140 140,160 200,80 260,60 320,100 380,40"
                      fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="20,180 80,140 140,160 200,80 260,60 320,100 380,40"
                      fill="url(#grad)" opacity="0.1" />
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Data points */}
                    {[[20,180],[80,140],[140,160],[200,80],[260,60],[320,100],[380,40]].map(([x, y], i) => (
                      <g key={i}>
                        <circle cx={x} cy={y} r="4" fill="#4f46e5" stroke="white" strokeWidth="2" />
                        <text x={x} y={y - 12} textAnchor="middle" className="text-[10px]" fill="#6b7280">
                          {["Jan","Feb","Mar","Apr","May","Jun","Jul"][i]}
                        </text>
                      </g>
                    ))}
                    <text x="50%" y="195" textAnchor="middle" fill="#9ca3af" fontSize="11">2026</text>
                  </svg>
                )}
                {selectedChart === "bar" && (
                  <div className="w-full h-full flex items-end justify-center gap-4 px-12">
                    {[65, 45, 80, 55, 90, 70, 85].map((h, i) => (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="w-10 bg-indigo-500 rounded-t" style={{ height: `${h * 1.8}px` }} />
                        <span className="text-[10px] text-gray-400">{["Jan","Feb","Mar","Apr","May","Jun","Jul"][i]}</span>
                      </div>
                    ))}
                  </div>
                )}
                {selectedChart === "scatter" && (
                  <div className="w-full h-full relative">
                    {Array.from({length: 30}).map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-3 h-3 bg-indigo-500 rounded-full"
                        style={{
                          left: `${15 + Math.random() * 70}%`,
                          top: `${10 + Math.random() * 75}%`,
                          opacity: 0.6 + Math.random() * 0.4,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Floating actions */}
              <div className="absolute top-4 right-4 flex gap-1">
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400" title="Download PNG">
                  <Download className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-400" title="Fullscreen">
                  <Maximize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowCustomizer(!showCustomizer)}
                  className={`p-2 rounded-lg hover:bg-gray-100 ${showCustomizer ? 'bg-gray-100 text-indigo-600' : 'text-gray-400'}`}
                  title="Customize"
                >
                  <Settings2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Insight Panel (30%) */}
        <div className="w-[360px] bg-white border-l border-gray-200 overflow-y-auto">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 bg-violet-100 rounded-lg flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
              </div>
              <span className="text-sm font-semibold text-gray-900">Executive Summary</span>
            </div>

            <div className="space-y-3">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-3">
                <p className="text-lg font-bold text-emerald-700">Revenue grew by 12% in Q4</p>
              </div>

              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                  Peak revenue occurred on <strong className="text-gray-900">Nov 24 ($14k)</strong>, likely driven by the Black Friday campaign.
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                  Conversion rate shows a strong correlation (0.85) with mobile traffic.
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-600">
                  <ChevronRight className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
                  Note: 3 regional outliers were excluded for clarity.
                </li>
              </ul>
            </div>
          </div>

          {/* Share & Export */}
          <div className="p-5 space-y-3">
            <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
              <Share2 className="w-4 h-4" />
              Share Dashboard
            </button>
            <button className="w-full flex items-center gap-2 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors">
              <Download className="w-4 h-4" />
              Export to Slack
            </button>
          </div>
        </div>
      </div>

      {/* Customizer Panel */}
      {showCustomizer && (
        <div className="fixed right-[360px] top-[57px] w-64 bg-white border-l border-gray-200 shadow-lg h-[calc(100vh-57px)] overflow-y-auto p-4 z-10">
          <h4 className="text-sm font-semibold text-gray-900 mb-4">Chart Settings</h4>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">X-Axis</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option>Date</option>
                <option>Region</option>
                <option>Category</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Y-Axis</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option>Revenue</option>
                <option>Orders</option>
                <option>Conversion Rate</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Color Theme</label>
              <div className="flex gap-2">
                {["#4f46e5", "#059669", "#e11d48", "#f59e0b", "#8b5cf6"].map(color => (
                  <button key={color} className="w-6 h-6 rounded-full ring-1 ring-gray-200" style={{ backgroundColor: color }} />
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Goal Line</label>
              <input type="number" placeholder="10000" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}