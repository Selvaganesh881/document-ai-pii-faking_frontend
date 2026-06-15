import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PdfUploadZone } from "@/components/PdfUploadZone";
import { DocumentComparison } from "@/components/DocumentComparison";
import { JsonResponseViewer } from "@/components/JsonResponseViewer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, CheckCircle2, Loader2, Search, AlertCircle } from "lucide-react";

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

function TemplateProcess() {
  // --- 1. Input State ---
  const [file, setFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState(DEFAULT_INSTRUCTION);
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  
  // --- 2. Pipeline State ---
  const [status, setStatus] = useState<Status>("idle"); // Start idle, not complete
  const [errorMessage, setErrorMessage] = useState("");

  // --- 3. Backend Response State ---
  const [originalText, setOriginalText] = useState("");
  const [maskedText, setMaskedText] = useState("");
  const [extractedJson, setExtractedJson] = useState<any>(null);
  const [unmaskedJson, setUnmaskedJson] = useState<any>(null);

  const execute = async () => {
    // Basic validation before hitting the server
    if (!file) {
      setErrorMessage("Please upload a PDF document first.");
      setStatus("error");
      return;
    }

    setStatus("running");
    setErrorMessage("");

    // Package the data for the API
    const formData = new FormData();
    formData.append("file", file);
    formData.append("user_instruction", instruction);
    formData.append("json_schema", schema);

    try {
      // Connect to your FastAPI backend
      const response = await fetch("http://localhost:8000/api/process", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.status === "success") {
        // Save the real data to state so the UI updates
        setOriginalText(result.original_text);
        setMaskedText(result.masked_text);
        setExtractedJson(result.extracted_json);
        setUnmaskedJson(result.unmasked_json);
        setStatus("complete");
      } else {
        setErrorMessage(result.message || "Pipeline failed processing.");
        setStatus("error");
      }
    } catch (error: any) {
      console.error("API Error:", error);
      setErrorMessage("Failed to connect to the Python backend. Is uvicorn running?");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-12">
          
          {/* --- Configuration Column --- */}
          <section className="lg:col-span-5">
            <h2 className="mb-4 text-lg font-bold tracking-tight">1. Configuration</h2>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">Upload Financial PDF</label>
                {/* Notice how we capture the file here */}
                <PdfUploadZone onFileSelect={(selectedFile) => setFile(selectedFile)} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">User Instruction</label>
                <Textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  rows={8}
                  className="resize-y bg-muted/30 font-mono text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Expected JSON Schema</label>
                <Textarea
                  value={schema}
                  onChange={(e) => setSchema(e.target.value)}
                  rows={8}
                  className="resize-y bg-muted/30 font-mono text-xs leading-relaxed"
                />
              </div>

              {status === "error" && (
                <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle className="h-4 w-4" />
                  {errorMessage}
                </div>
              )}

              <Button
                onClick={execute}
                disabled={status === "running"}
                className="h-12 w-full bg-coral text-base font-semibold text-white hover:bg-coral/90"
              >
                {status === "running" ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Running pipeline…
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-5 w-5" />
                    Execute LangGraph Pipeline
                  </>
                )}
              </Button>
            </div>
          </section>

          {/* --- Execution Column --- */}
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
                {/* Live Document Comparison */}
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Search className="h-4 w-4" />
                      Document Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DocumentComparison
                      original={originalText}
                      anonymized={maskedText}
                    />
                  </CardContent>
                </Card>

                {/* Live JSON Extraction Results */}
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm text-muted-foreground">🔒 LLM Output (Anonymized Data)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <JsonResponseViewer data={extractedJson} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="py-3">
                      <CardTitle className="text-sm font-bold text-coral">🔓 Final Output (Restored Real Data)</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <JsonResponseViewer data={unmaskedJson} />
                    </CardContent>
                  </Card>
                </div>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}