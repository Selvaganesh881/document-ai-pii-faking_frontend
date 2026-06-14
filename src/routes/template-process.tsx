import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { PdfUploadZone } from "@/components/PdfUploadZone";
import { DocumentComparison } from "@/components/DocumentComparison";
import { JsonResponseViewer } from "@/components/JsonResponseViewer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Rocket, CheckCircle2, Loader2, Search } from "lucide-react";

export const Route = createFileRoute("/template-process")({
  head: () => ({
    meta: [
      { title: "Template & Process — Document AI" },
      {
        name: "description",
        content:
          "Configure extraction templates, upload PDFs, and run the PII-anonymizing LLM extraction pipeline.",
      },
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

const MOCK_ORIGINAL = `My Invoice

Name: Alan

Address: 3-100A, Khazhakudam, Kerala - 588939

Account Number: 8824949924794

Balance: 683242

...[TRUNCATED]`;

const MOCK_ANON = `My Invoice

Name: David Mcguire

Address: 3-100A, Blackshire, Foxberg - 588939

Account Number: 8824949924794

Balance: 683242

...[TRUNCATED]`;

const MOCK_RESULT = {
  account_holder_name: "David Mcguire",
  total_balance: 683242,
  account_number: "8824949924794",
};

type Status = "idle" | "running" | "complete";

function TemplateProcess() {
  const [instruction, setInstruction] = useState(DEFAULT_INSTRUCTION);
  const [schema, setSchema] = useState(DEFAULT_SCHEMA);
  const [status, setStatus] = useState<Status>("complete");

  const execute = () => {
    // TODO: wire to backend pipeline (POST /pipeline/run)
    setStatus("running");
    setTimeout(() => setStatus("complete"), 1500);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Configuration */}
          <section className="lg:col-span-5">
            <h2 className="mb-4 text-lg font-bold tracking-tight">1. Configuration</h2>

            <div className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium">Upload Financial PDF</label>
                <PdfUploadZone />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">User Instruction</label>
                <Textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  rows={10}
                  className="resize-y bg-muted/30 font-mono text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Expected JSON Schema</label>
                <Textarea
                  value={schema}
                  onChange={(e) => setSchema(e.target.value)}
                  rows={10}
                  className="resize-y bg-muted/30 font-mono text-xs leading-relaxed"
                />
              </div>

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

          {/* Execution */}
          <section className="lg:col-span-7">
            <h2 className="mb-4 text-lg font-bold tracking-tight">2. Pipeline Execution</h2>

            <Card className="mb-6">
              <CardContent className="flex items-center gap-2 py-3">
                {status === "running" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    <span className="text-sm">Executing graph…</span>
                  </>
                ) : status === "complete" ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">Graph Execution Complete!</span>
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Click Execute to run the pipeline.
                  </span>
                )}
              </CardContent>
            </Card>

            {status !== "idle" && (
              <>
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Search className="h-4 w-4" />
                      Document Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <DocumentComparison
                      original={MOCK_ORIGINAL}
                      anonymized={MOCK_ANON}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <JsonResponseViewer data={MOCK_RESULT} />
                  </CardContent>
                </Card>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
