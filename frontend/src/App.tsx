import { Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Settings from "./pages/Settings";

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 32 32" className="w-5 h-5 text-white" fill="none">
              <path d="M8 16l6 6 10-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">AnalystFlow</h1>
        </div>
        <nav className="flex items-center gap-4">
          <a href="/" className="text-sm text-gray-600 hover:text-gray-900">Home</a>
          <a href="/settings" className="text-sm text-gray-600 hover:text-gray-900">Settings</a>
        </nav>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;