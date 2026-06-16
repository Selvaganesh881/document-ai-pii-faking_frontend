import { FileText, Shield } from "lucide-react";
import { memo } from "react";

type Props = {
  original: string;
  anonymized: string;
};

export const DocumentComparison = memo(function DocumentComparison({ original, anonymized }: Props) {
  return (
    // Added h-full and w-full so the grid fills the expandable card
    <div className="grid h-full w-full gap-4 md:grid-cols-2">
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
});

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
    // Added h-full to the outer wrapper
    <div className="flex h-full flex-col">
      <div className="mb-2 flex flex-shrink-0 items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      
      {/* This wrapper forces the text area to expand.
        min-h-[18rem] ensures it stays a nice standard size when NOT maximized.
        flex-1 allows it to stretch and fill the massive white space when maximized.
      */}
      <div className="relative flex-1 min-h-[18rem]">
        <pre
          className={`absolute inset-0 overflow-auto rounded-lg border p-3 text-xs leading-relaxed ${
            tint ? "bg-coral/5" : "bg-muted/40"
          } font-mono text-foreground`}
        >
          {content}
        </pre>
      </div>
    </div>
  );
}