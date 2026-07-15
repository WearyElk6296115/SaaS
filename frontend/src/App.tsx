import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Workspace from "./pages/Workspace";
import CleanCanvas from "./pages/CleanCanvas";
import Visualize from "./pages/Visualize";
import Connections from "./pages/Connections";
import Settings from "./pages/Settings";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <main className="flex-1 ml-64 min-h-screen">
        <Routes>
          <Route path="/" element={<Workspace />} />
          <Route path="/workspace" element={<Workspace />} />
          <Route path="/workspace/:id" element={<Workspace />} />
          <Route path="/clean" element={<CleanCanvas />} />
          <Route path="/visualize" element={<Visualize />} />
          <Route path="/visualize/:id" element={<Visualize />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;