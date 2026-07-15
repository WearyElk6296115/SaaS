import { NavLink } from "react-router-dom";
import {
  Sparkles,
  Database,
  BarChart3,
  Settings,
  SquareTerminal,
  Trash2,
  Plus,
} from "lucide-react";

const navItems = [
  { to: "/workspace", icon: SquareTerminal, label: "SQL Workspace" },
  { to: "/clean", icon: Trash2, label: "Clean Canvas" },
  { to: "/visualize", icon: BarChart3, label: "Insight Engine" },
  { to: "/connections", icon: Database, label: "Connections" },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 w-64 h-full bg-white border-r border-gray-200 flex flex-col z-30">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-900">AnalystFlow</h1>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">AI Co-Pilot</p>
          </div>
        </div>
      </div>

      {/* New Workspace */}
      <div className="p-3">
        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
          <Plus className="w-4 h-4" />
          New Workspace
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`
            }
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Recent Workspaces */}
      <div className="px-4 py-3 border-t border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Recent
        </p>
        <div className="space-y-1">
          <button className="w-full text-left px-2 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded truncate">
            Revenue Analysis Q4
          </button>
          <button className="w-full text-left px-2 py-1.5 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded truncate">
            Customer Segmentation
          </button>
        </div>
      </div>

      {/* Bottom */}
      <div className="p-3 border-t border-gray-100">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? "bg-indigo-50 text-indigo-700"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            }`
          }
        >
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>
      </div>
    </aside>
  );
}