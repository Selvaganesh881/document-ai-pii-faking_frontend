import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, memo } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PdfUploadZone } from "@/components/PdfUploadZone";
import { DocumentComparison } from "@/components/DocumentComparison";
import { JsonResponseViewer } from "@/components/JsonResponseViewer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, CheckCircle2, Loader2, Search, AlertCircle } from "lucide-react";
import { processDocument, ApiError } from "@/lib/api";

export const Route = createFileRoute("/template-process")({
  head: () => ({
    meta: [
      { title: "Template & Process — Document AI" },
      { name: "description", content: "Run the PII-anonymizing LLM pipeline." },
    ],
  }),
  component: TemplateProcess,
});

const DEFAULT_INSTRUCTION = `Extract the parameters defined in the schema from the document provided below.

EXTRACTION INSTRUCTIONS:
- Extract values exactly as they appear in the text.
- If a specific value cannot be found in the document, you must still include the key in your JSON response.
- For missing string values, use the exact text: "NOT_FOUND".
- For missing numbers or booleans, use: null.`;

const DEFAULT_SCHEMA = `{
  "title": "DocumentExtraction",
  "type": "object",
  "properties": {
    "account_holder_name": { "type": "string" },
    "total_balance": { "type": "number" },
    "account_number": { "type": "string" }
  },
  "required": ["account_holder_name", "total_balance"]
}`;

type Status = "idle" | "running" | "complete" | "error";

// ------------------------------------------------------------------
// 1. Reusable, safe Textarea component (Freeze issue fixed here)
// ------------------------------------------------------------------
const TextareaInput = memo(function TextareaInput({
  label,
  defaultValue,
  inputRef,
}: {
  label: string;
  defaultValue: string;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <textarea
        ref={inputRef}
        defaultValue={defaultValue}
        spellCheck={false}
        rows={10}
        className="w-full h-64 rounded-md border border-slate-300 bg-slate-50 p-4 font-mono text-xs leading-relaxed text-slate-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
});

// ------------------------------------------------------------------
// 2. Configuration Panel (Input API)
// ------------------------------------------------------------------
function ConfigurationPanel({
  setFile,
  instructionRef,
  schemaRef,
  status,
  errorMessage,
  onReset,
  onExecute,
}: {
  setFile: (file: File | null) => void;
  instructionRef: React.RefObject<HTMLTextAreaElement>;
  schemaRef: React.RefObject<HTMLTextAreaElement>;
  status: Status;
  errorMessage: string;
  onReset: () => void;
  onExecute: () => void;
}) {
  return (
    <section className="lg:col-span-5">
      <h2 className="mb-4 text-lg font-bold tracking-tight">1. Configuration</h2>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium">Upload Financial PDF</label>
          <PdfUploadZone onFileSelect={setFile} />
        </div>

        <TextareaInput
          label="User Instruction"
          defaultValue={DEFAULT_INSTRUCTION}
          inputRef={instructionRef}
        />

        <TextareaInput
          label="Expected JSON Schema"
          defaultValue={DEFAULT_SCHEMA}
          inputRef={schemaRef}
        />

        {status === "error" && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" />
            {errorMessage}
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={onReset} variant="outline" className="flex-1">
            Reset Defaults
          </Button>
          <Button
            onClick={onExecute}
            disabled={status === "running"}
            className="flex-1 bg-[#FF6F61] text-white hover:bg-[#FF6F61]/90"
          >
            {status === "running" ? (
              <span className="flex items-center justify-center">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Running…
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <Rocket className="mr-2 h-5 w-5" />
                Execute Pipeline
              </span>
            )}
          </Button>
        </div>
      </div>
    </section>
  );
}

// ------------------------------------------------------------------
// 3. Results Panel (Output View)
// ------------------------------------------------------------------
function ExecutionResultsPanel({
  status,
  originalText,
  maskedText,
  extractedJson,
  unmaskedJson,
}: {
  status: Status;
  originalText: string;
  maskedText: string;
  extractedJson: any;
  unmaskedJson: any;
}) {
  return (
    <section className="lg:col-span-7">
      <h2 className="mb-4 text-lg font-bold tracking-tight">2. Pipeline Execution</h2>

      <Card className="mb-6">
        <CardContent className="flex items-center gap-2 py-3">
          {status === "running" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-sm">Executing graph... Documenting passing to Qwen3-4B...</span>
            </>
          ) : status === "complete" ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Graph Execution Complete!</span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              Upload a file and click Execute to run the pipeline.
            </span>
          )}
        </CardContent>
      </Card>

      {status === "complete" && (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Search className="h-4 w-4" />
                Document Comparison
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentComparison original={originalText} anonymized={maskedText} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm text-muted-foreground">
                  🔒 LLM Output (Anonymized Data)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <JsonResponseViewer data={extractedJson} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-bold text-coral">
                  🔓 Final Output (Restored Real Data)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <JsonResponseViewer data={unmaskedJson} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </section>
  );
}

// ------------------------------------------------------------------
// 4. Main Parent Component (State Orchestrator)
// ------------------------------------------------------------------
function TemplateProcess() {
  const instructionRef = useRef<HTMLTextAreaElement>(null);
  const schemaRef = useRef<HTMLTextAreaElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [originalText, setOriginalText] = useState("");
  const [maskedText, setMaskedText] = useState("");
  const [extractedJson, setExtractedJson] = useState<any>(null);
  const [unmaskedJson, setUnmaskedJson] = useState<any>(null);

  const handleResetDefaults = () => {
    if (instructionRef.current) instructionRef.current.value = DEFAULT_INSTRUCTION;
    if (schemaRef.current) schemaRef.current.value = DEFAULT_SCHEMA;
  };

  const handleExecute = async () => {
    if (!file) {
      setErrorMessage("Please upload a PDF document first.");
      setStatus("error");
      return;
    }

    setStatus("running");
    setErrorMessage("");

    try {
      const currentInstruction = instructionRef.current?.value || "";
      const currentSchema = schemaRef.current?.value || "";

      const result = await processDocument({
        file,
        user_instruction: currentInstruction,
        json_schema: currentSchema,
      });

      if (result.status === "success") {
        setOriginalText(result.original_text);
        setMaskedText(result.masked_text);
        setExtractedJson(result.extracted_json);
        setUnmaskedJson(result.unmasked_json);
        setStatus("complete");
      } else {
        setErrorMessage(result.message || "Pipeline failed processing.");
        setStatus("error");
      }
    } catch (error) {
      console.error("API Error:", error);
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : "Unexpected error while calling the backend."
      );
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-12">
          
          <ConfigurationPanel
            setFile={setFile}
            instructionRef={instructionRef}
            schemaRef={schemaRef}
            status={status}
            errorMessage={errorMessage}
            onReset={handleResetDefaults}
            onExecute={handleExecute}
          />

          <ExecutionResultsPanel
            status={status}
            originalText={originalText}
            maskedText={maskedText}
            extractedJson={extractedJson}
            unmaskedJson={unmaskedJson}
          />

        </div>
      </main>
    </div>
  );
}

export default TemplateProcess;