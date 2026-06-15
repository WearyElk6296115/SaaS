import { useState } from "react";

function Settings() {
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [dbConnection, setDbConnection] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: Save settings via API
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900">Settings</h2>

      {/* LLM Configuration */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">AI Provider</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              OpenAI API Key
            </label>
            <input
              type="password"
              value={openaiKey}
              onChange={(e) => setOpenaiKey(e.target.value)}
              placeholder="sk-..."
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anthropic API Key
            </label>
            <input
              type="password"
              value={anthropicKey}
              onChange={(e) => setAnthropicKey(e.target.value)}
              placeholder="sk-ant-..."
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Database Connection */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">Database Connection</h3>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Connection String
          </label>
          <input
            type="text"
            value={dbConnection}
            onChange={(e) => setDbConnection(e.target.value)}
            placeholder="sqlite:///./analystflow.db"
            className="input font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            Supports SQLite, PostgreSQL, MySQL. Format:{" "}
            <code className="bg-gray-100 px-1 rounded">
              dialect://user:pass@host:port/dbname
            </code>
          </p>
        </div>
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button onClick={handleSave} className="btn-primary">
          Save Settings
        </button>
        {saved && (
          <span className="text-green-600 text-sm font-medium">
            Settings saved successfully
          </span>
        )}
      </div>
    </div>
  );
}

export default Settings;