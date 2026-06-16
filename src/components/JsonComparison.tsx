import { Brain, Unlock } from "lucide-react";
import { memo } from "react";
import { JsonResponseViewer } from "./JsonResponseViewer";

type Props = {
  anonymizedJson: Record<string, unknown> | null;
  restoredJson: Record<string, unknown> | null;
};

export const JsonComparison = memo(function JsonComparison({ 
  anonymizedJson, 
  restoredJson 
}: Props) {
  return (
    <div className="grid h-full w-full gap-4 md:grid-cols-2">
      <JsonResponseViewer 
        title="LLM Output (Anonymized)"
        icon={<Brain className="h-4 w-4 text-muted-foreground" />}
        data={anonymizedJson} 
      />
      <JsonResponseViewer 
        title="Final Output (Restored Data)"
        icon={<Unlock className="h-4 w-4 text-coral" />}
        data={restoredJson} 
        tint={true}
      />
    </div>
  );
});