import CodeMirror from "@uiw/react-codemirror";
import { sql } from "@codemirror/lang-sql";
import { oneDark } from "@codemirror/theme-one-dark";

interface QueryEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

export default function QueryEditor({ value, onChange, readOnly = false }: QueryEditorProps) {
  return (
    <CodeMirror
      value={value}
      height="auto"
      minHeight="100px"
      extensions={[sql()]}
      theme={oneDark}
      onChange={(val) => onChange(val)}
      readOnly={readOnly}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        autocompletion: true,
      }}
      className="text-sm"
    />
  );
}