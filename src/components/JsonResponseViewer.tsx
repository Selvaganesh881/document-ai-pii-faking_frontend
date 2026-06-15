import { Brain } from "lucide-react";
import { memo } from "react";

type Props = {
  data: Record<string, unknown> | null;
  model?: string;
};

export const JsonResponseViewer = memo(function JsonResponseViewer({ 
  data, 
  model = "Qwen3-4B" 
}: Props) {
  // Graceful fallback if data is empty or null
  const formattedJson = data 
    ? JSON.stringify(data, null, 2) 
    : "No data extracted.";

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <Brain className="h-4 w-4 text-coral" />
        <span className="text-sm font-semibold text-foreground">
          Extracted JSON Response
        </span>
        <span className="text-xs text-muted-foreground">({model})</span>
      </div>
      
      {/* We use a single text node via JSON.stringify here. 
        This prevents React from attempting to build thousands 
        of individual DOM elements for large JSON payloads.
      */}
      <pre className="max-h-[500px] overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed text-foreground">
        {formattedJson}
      </pre>
    </div>
  );
});