import { useState } from "react";
import { Key, Bell, User, Palette, Globe } from "lucide-react";

function Settings() {
  const [openaiKey, setOpenaiKey] = useState("");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const sections = [
    {
      icon: Key,
      title: "AI Provider",
      content: (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">OpenAI API Key</label>
            <input type="password" value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} placeholder="sk-..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Anthropic API Key</label>
            <input type="password" value={anthropicKey} onChange={(e) => setAnthropicKey(e.target.value)} placeholder="sk-ant-..." className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Default Provider</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option>OpenAI (GPT-4)</option>
                <option>Anthropic (Claude 3.5)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Default Model</label>
              <select className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm">
                <option>gpt-4 (Best quality)</option>
                <option>gpt-3.5-turbo (Faster, cheaper)</option>
              </select>
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Palette,
      title: "Appearance",
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">Theme</span>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {["Light", "Dark", "System"].map((t) => (
                <button key={t} className={`px-3 py-1 text-xs font-medium rounded-md ${t === "Light" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Bell,
      title: "Notifications",
      content: (
        <div className="space-y-3">
          {["Email reports", "Slack alerts", "Query completion"].map((n) => (
            <label key={n} className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{n}</span>
              <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-indigo-500" />
            </label>
          ))}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-3xl">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Settings</h2>
      <p className="text-sm text-gray-500 mb-6">Configure your AnalystFlow experience</p>

      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.title} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
              </div>
              {section.content}
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">Save Settings</button>
        {saved && <span className="text-sm text-emerald-600 font-medium">Settings saved successfully</span>}
      </div>
    </div>
  );
}

export default Settings;