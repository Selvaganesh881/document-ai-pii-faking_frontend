import { memo } from "react";
import { 
  FileUp, 
  ScanText, 
  ShieldAlert, 
  BrainCircuit, 
  Unlock, 
  Braces 
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PIPELINE_STEPS = [
  {
    id: "input",
    title: "1. Input",
    description: "User uploads a financial PDF document.",
    icon: FileUp,
    color: "text-blue-500",
    bgColor: "bg-blue-100",
  },
  {
    id: "ocr",
    title: "2. PDF Reader",
    description: "Extracts raw text and layout using OCR/Parsers.",
    icon: ScanText,
    color: "text-indigo-500",
    bgColor: "bg-indigo-100",
  },
  {
    id: "pii-fake",
    title: "3. PII Faking",
    description: "Detects and masks sensitive entities (Anonymization).",
    icon: ShieldAlert,
    color: "text-amber-500",
    bgColor: "bg-amber-100",
  },
  {
    id: "llm",
    title: "4. LLM Extraction",
    description: "Prompts the AI model with the safe, anonymized text.",
    icon: BrainCircuit,
    color: "text-coral", 
    bgColor: "bg-coral/10",
  },
  {
    id: "reverse",
    title: "5. Reverse PII",
    description: "Maps the fake data in the AI response back to the real values.",
    icon: Unlock,
    color: "text-emerald-500",
    bgColor: "bg-emerald-100",
  },
  {
    id: "json",
    title: "6. JSON Extraction",
    description: "Validates and outputs the final structured data.",
    icon: Braces,
    color: "text-slate-700",
    bgColor: "bg-slate-200",
  },
];

export const PipelineVisualizer = memo(function PipelineVisualizer() {
  return (
    <div className="mx-auto max-w-md py-6">
      <h3 className="mb-8 text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        Architecture Flow
      </h3>
      
      <div className="relative ml-4 md:ml-8 border-l-2 border-muted-foreground/20 space-y-8">
        {PIPELINE_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === PIPELINE_STEPS.length - 1;

          return (
            <div key={step.id} className="relative pl-8 md:pl-10">
              {/* Connector Icon Ring */}
              <div className="absolute -left-5 top-1 flex h-10 w-10 items-center justify-center rounded-full border-[3px] border-background bg-background shadow-sm">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step.bgColor}`}>
                  <Icon className={`h-4 w-4 ${step.color}`} />
                </div>
              </div>

              {/* Step Card */}
              <Card className="border-none shadow-sm bg-muted/30">
                <CardContent className="p-4">
                  <h4 className="text-sm font-bold text-foreground">{step.title}</h4>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
});