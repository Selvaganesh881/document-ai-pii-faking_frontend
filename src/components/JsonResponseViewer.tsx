import { Brain } from "lucide-react";

type Props = {
  data: Record<string, unknown>;
  model?: string;
};

export function JsonResponseViewer({ data, model = "Qwen3-4B" }: Props) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Brain className="h-4 w-4 text-coral" />
        <span className="text-sm font-semibold text-foreground">
          Extracted JSON Response
        </span>
        <span className="text-xs text-muted-foreground">({model})</span>
      </div>
      <pre className="overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed">
        <Json value={data} />
      </pre>
    </div>
  );
}

function Json({ value, indent = 0 }: { value: unknown; indent?: number }) {
  const pad = "  ".repeat(indent);
  if (value === null) return <span className="text-muted-foreground">null</span>;
  if (typeof value === "string")
    return <span className="text-coral">"{value}"</span>;
  if (typeof value === "number")
    return <span className="text-blue-600 dark:text-blue-400">{value}</span>;
  if (typeof value === "boolean")
    return <span className="text-purple-600 dark:text-purple-400">{String(value)}</span>;
  if (Array.isArray(value)) {
    return (
      <>
        {"["}
        {value.map((v, i) => (
          <div key={i}>
            {pad}  <Json value={v} indent={indent + 1} />
            {i < value.length - 1 ? "," : ""}
          </div>
        ))}
        {pad}{"]"}
      </>
    );
  }
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);
    return (
      <>
        {"{"}
        {entries.map(([k, v], i) => (
          <div key={k}>
            {pad}  <span className="text-foreground">"{k}"</span>
            <span className="text-muted-foreground">: </span>
            <Json value={v} indent={indent + 1} />
            {i < entries.length - 1 ? "," : ""}
          </div>
        ))}
        {pad}{"}"}
      </>
    );
  }
  return <span>{String(value)}</span>;
}
