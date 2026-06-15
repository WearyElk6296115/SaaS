import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
}

function QueryEditor({ value, onChange }: QueryEditorProps) {
  return (
    <div className="card">
      <h3 className="text-sm font-medium text-gray-700 mb-2">SQL Query</h3>
      <CodeMirror
        value={value}
        height="200px"
        extensions={[sql()]}
        theme={oneDark}
        onChange={(val) => onChange(val)}
        placeholder="SELECT ..."
        className="rounded-lg overflow-hidden border border-gray-200"
      />
    </div>
  );
}

export default QueryEditor;