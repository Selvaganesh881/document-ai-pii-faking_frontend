import { memo } from "react";

type Props = {
  title: string;
  icon: React.ReactNode;
  data: Record<string, unknown> | null;
  tint?: boolean;
};

export const JsonResponseViewer = memo(function JsonResponseViewer({ 
  title,
  icon,
  data, 
  tint 
}: Props) {
  const formattedJson = data 
    ? JSON.stringify(data, null, 2) 
    : "No data extracted.";

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex flex-shrink-0 items-center gap-2">
        {icon}
        <span className="text-sm font-semibold text-foreground">
          {title}
        </span>
      </div>
      
      <div className="relative flex-1 min-h-[18rem]">
        <pre className={`absolute inset-0 overflow-auto rounded-lg border p-4 font-mono text-xs leading-relaxed text-foreground ${
          tint ? "bg-coral/5 border-coral/20" : "bg-muted/40 border-slate-200"
        }`}>
          {formattedJson}
        </pre>
      </div>
    </div>
  );
});