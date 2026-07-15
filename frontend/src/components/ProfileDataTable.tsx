import { Download } from "lucide-react";

interface ProfileDataTableProps {
  columns: string[];
  rows: unknown[][];
}

function getColumnProfile(col: string): { type: "numeric" | "categorical" | "date"; bars: number[] } {
  if (col === "revenue" || col === "avg_order_value" || col === "order_count") {
    return { type: "numeric", bars: [40, 60, 80, 50, 30, 70] };
  }
  if (col === "region_name") {
    return { type: "categorical", bars: [80, 60, 40, 30, 20] };
  }
  return { type: "categorical", bars: [50, 50, 50, 50, 50] };
}

export default function ProfileDataTable({ columns, rows }: ProfileDataTableProps) {
  if (columns.length === 0) return null;

  return (
    <div className="overflow-hidden">
      {/* Mini export bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
        <span className="text-xs text-gray-500">{rows.length.toLocaleString()} rows returned</span>
        <button className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700">
          <Download className="w-3 h-3" /> Export CSV
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((col) => {
                const profile = getColumnProfile(col);
                return (
                  <th key={col} className="px-4 py-3 text-left border-r border-gray-100 last:border-r-0">
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{col}</div>
                    {/* Mini histogram */}
                    <div className="mt-1.5 flex items-end gap-0.5 h-6">
                      {profile.bars.map((h, i) => (
                        <div
                          key={i}
                          className="w-full bg-indigo-200 rounded-t"
                          style={{ height: `${h}%`, maxWidth: "8px" }}
                        />
                      ))}
                    </div>
                    <div className="mt-1 flex gap-1 text-[10px] text-gray-400">
                      {profile.type === "numeric" && (
                        <>
                          <span>Min: 65.4k</span>
                          <span>Max: 284.5k</span>
                        </>
                      )}
                      {profile.type === "categorical" && (
                        <>
                          <span>5 unique</span>
                        </>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-gray-50 transition-colors">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2.5 text-sm text-gray-700 whitespace-nowrap font-mono">
                    {cell === null || cell === undefined ? (
                      <span className="text-rose-300 italic">NULL</span>
                    ) : (
                      typeof cell === "number" ? cell.toLocaleString() : String(cell)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}