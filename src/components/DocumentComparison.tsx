import { FileText, Shield } from "lucide-react";

type Props = {
  original: string;
  anonymized: string;
};

export function DocumentComparison({ original, anonymized }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Panel
        icon={<FileText className="h-4 w-4 text-muted-foreground" />}
        label="Original Raw Markdown"
        content={original}
      />
      <Panel
        icon={<Shield className="h-4 w-4 text-coral" />}
        label="Anonymized Markdown (Sent to LLM)"
        content={anonymized}
        tint
      />
    </div>
  );
}

function Panel({
  icon,
  label,
  content,
  tint,
}: {
  icon: React.ReactNode;
  label: string;
  content: string;
  tint?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <pre
        className={`max-h-72 overflow-auto rounded-lg border p-3 text-xs leading-relaxed ${
          tint ? "bg-coral/5" : "bg-muted/40"
        } font-mono text-foreground`}
      >
        {content}
      </pre>
    </div>
  );
}
