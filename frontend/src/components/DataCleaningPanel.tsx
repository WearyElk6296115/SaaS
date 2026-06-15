interface DataCleaningPanelProps {
  issues: Array<{
    column: string;
    issue_type: string;
    description: string;
    suggestion: string;
    confidence: string;
  }>;
}

function DataCleaningPanel({ issues }: DataCleaningPanelProps) {
  if (!issues || issues.length === 0) {
    return (
      <div className="card text-center text-gray-400 py-8">
        <p className="text-sm">Analyze your data to see cleaning suggestions</p>
      </div>
    );
  }

  const confidenceColors: Record<string, string> = {
    high: "bg-red-100 text-red-800",
    medium: "bg-yellow-100 text-yellow-800",
    low: "bg-blue-100 text-blue-800",
  };

  const issueIcons: Record<string, string> = {
    missing_values: "⚠️",
    duplicates: "🔁",
    wrong_type: "🔧",
    outliers: "📊",
    inconsistent_formatting: "📝",
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">
        Data Cleaning Suggestions ({issues.length})
      </h3>
      <div className="space-y-3">
        {issues.map((issue, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span>{issueIcons[issue.issue_type] || "🔍"}</span>
                <span className="font-medium text-gray-900">
                  {issue.column}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  {issue.issue_type.replace(/_/g, " ")}
                </span>
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  confidenceColors[issue.confidence] || "bg-gray-100 text-gray-800"
                }`}
              >
                {issue.confidence}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">{issue.description}</p>
            <p className="text-sm text-brand-600 font-medium">{issue.suggestion}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DataCleaningPanel;