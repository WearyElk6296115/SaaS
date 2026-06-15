interface ResultsTableProps {
  columns: string[];
  rows: unknown[][];
}

function ResultsTable({ columns, rows }: ResultsTableProps) {
  if (columns.length === 0) {
    return (
      <div className="card text-center text-gray-400 py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-300 mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
        <p className="text-sm">Run a query to see results here</p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className="px-4 py-2 text-sm text-gray-700 whitespace-nowrap"
                  >
                    {String(cell ?? "NULL")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500">
        {rows.length} row{rows.length !== 1 ? "s" : ""} returned
      </div>
    </div>
  );
}

export default ResultsTable;