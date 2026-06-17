import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { PdfUploadZone } from "@/components/PdfUploadZone";
import { DocumentComparison } from "@/components/DocumentComparison";
import { TextareaInput } from "@/components/TextareaInput";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Rocket, 
  CheckCircle2, 
  Loader2, 
  Search, 
  AlertCircle,
  Copy,
  Maximize2,
  Minimize2,
  Check,
  Brain,
  Timer
} from "lucide-react";
import { processDocument, ApiError } from "@/lib/api";
import { JsonComparison } from "@/components/JsonComparison";
import { PipelineVisualizer } from "@/components/PipelineVisualizer";

export const Route = createFileRoute("/template-process")({
  head: () => ({
    meta: [
      { title: "Template & Process — Document AI" },
      { name: "description", content: "Run the PII-anonymizing LLM pipeline." },
    ],
  }),
  component: TemplateProcess,
});

const DEFAULT_INSTRUCTION = `ROLE & OBJECTIVE:
You are a precision-focused Document AI specialized in structured financial data extraction. Your task is to extract exact parameters from the provided raw text invoice and map them perfectly to the requested JSON schema.

EXTRACTION HIERARCHY & NORMALIZATION RULES:
1. DATES: Normalize ALL dates into the strict ISO 8601 standard format: YYYY-MM-DD. 
   - Example: "October 12, 2026" must be extracted as "2026-10-12".
   - If an invoice says "Upon Receipt" or "Net 30" instead of an actual date string, parse the due_date value as "NOT_FOUND".

2. NUMBERS: Strip out all currency symbols ($, €, £), commas used as thousands separators, and white spaces. Ensure the resulting value is a raw floating-point number or integer.
   - Example: "$5,696.25" must be extracted as 5696.25.

3. TEXT & ADDRESSES: Clean up unnecessary line breaks within single fields like corporate names or physical addresses. Format them into a single-line, comma-separated string.

LINE ITEMS SUB-OBJECT RULES:
- Break out each unique line item row from the table into a distinct object within the "line_items" array.
- Include sub-bullet points or item descriptions directly within the main description field string, cleanly separated by a hyphen or space.

EDGE CASE & ERROR HANDLING:
- Strictly follow the property rules in the schema.
- If a property string field cannot be found anywhere in the text, assign it the exact text value: "NOT_FOUND".
- If a property number or array field cannot be found, assign it a JSON literal value of: null.
- DO NOT invent, hallucinate, or infer data. Extract values exactly as they present themselves.

OUTPUT FORMAT:
Return your answer ONLY as a single, valid JSON object matching the schema. Do not write markdown blocks like ### or comma, quatations json ... , and do not append conversational text before or after the JSON payload.`;

const DEFAULT_SCHEMA = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Intelligent_Invoice_Extraction",
  "description": "Standardized schema for structured financial document data extraction.",
  "type": "object",
  "properties": {
    "invoice_number": {
      "type": "string",
      "description": "The unique identifying alphanumeric string or number of the invoice as stated on the document."
    },
    "invoice_date": {
      "type": "string",
      "format": "date",
      "description": "The date the invoice was issued. Normalize to ISO 8601 format (YYYY-MM-DD)."
    },
    "due_date": {
      "type": "string",
      "format": "date",
      "description": "The final date payment is expected. Normalize to ISO 8601 format (YYYY-MM-DD)."
    },
    "seller_name": {
      "type": "string",
      "description": "The full legal name or trade name of the business issuing the invoice."
    },
    "seller_address": {
      "type": "string",
      "description": "The complete billing address of the seller, including street, city, state, and zip code."
    },
    "currency": {
      "type": "string",
      "minLength": 3,
      "maxLength": 3,
      "description": "The 3-letter ISO 4217 currency code (e.g., USD, EUR, CAD). Default to USD if symbol is $."
    },
    "subtotal_amount": {
      "type": ["number", "null"],
      "description": "The total amount before taxes, discounts, or additions."
    },
    "tax_amount": {
      "type": ["number", "null"],
      "description": "The total tax amount charged on this invoice."
    },
    "total_amount": {
      "type": "number",
      "description": "The final absolute payable amount including all taxes and fees."
    },
    "line_items": {
      "type": "array",
      "description": "Individual items or services listed on the invoice.",
      "items": {
        "type": "object",
        "properties": {
          "description": {
            "type": "string",
            "description": "The description text of the line item item or service."
          },
          "quantity": {
            "type": ["number", "null"],
            "description": "The number of items or hours logged."
          },
          "unit_price": {
            "type": ["number", "null"],
            "description": "The cost per single unit or single hour."
          },
          "amount": {
            "type": ["number", "null"],
            "description": "The total amount for this line item (quantity * unit_price)."
          }
        },
        "required": ["description", "amount"]
      }
    }
  },
  "required": [
    "invoice_number",
    "invoice_date",
    "seller_name",
    "currency",
    "total_amount"
  ],
  "additionalProperties": false
}`;

type Status = "idle" | "running" | "complete" | "error";

// ------------------------------------------------------------------
// 1. Generic Expandable Card (Wraps ANY content)
// ------------------------------------------------------------------
function ExpandableCard({ 
  title, 
  titleClassName,
  children,
  copyText
}: { 
  title: React.ReactNode;
  titleClassName?: string;
  children: React.ReactNode;
  copyText?: string;
}) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!copyText) return;
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cardClasses = isMaximized 
    ? "fixed inset-4 z-50 flex flex-col shadow-2xl transition-all duration-200 bg-background" 
    : "flex flex-col h-full";

  return (
    <>
      {isMaximized && (
        <div 
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm" 
          onClick={() => setIsMaximized(false)} 
        />
      )}
      
      <Card className={cardClasses}>
        <CardHeader className="py-3 flex flex-row items-center justify-between space-y-0 border-b bg-muted/30">
          <CardTitle className={`text-sm ${titleClassName || ""}`}>
            {title}
          </CardTitle>
          <div className="flex items-center gap-1">
            {copyText && (
              <Button variant="ghost" size="icon" onClick={handleCopy} title="Copy Content" className="h-8 w-8">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setIsMaximized(!isMaximized)} title={isMaximized ? "Minimize" : "Maximize"} className="h-8 w-8">
              {isMaximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className={`pt-4 flex flex-col min-h-0 ${isMaximized ? "flex-1" : "h-full"}`}>
          {children}
        </CardContent>
      </Card>
    </>
  );
}

// ------------------------------------------------------------------
// 2. Configuration Panel
// ------------------------------------------------------------------
function ConfigurationPanel({
  file,
  setFile,
  instruction,
  setInstruction,
  schema,
  setSchema,
  status,
  errorMessage,
  onReset,
  onExecute,
}: {
  file: File | null;
  setFile: (file: File | null) => void;
  instruction: string;
  setInstruction: (val: string) => void;
  schema: string;
  setSchema: (val: string) => void;
  status: Status;
  errorMessage: string;
  onReset: () => void;
  onExecute: () => void;
}) {
  const isRunning = status === "running";

  return (
    <section className="lg:col-span-5">
      <h2 className="mb-4 text-lg font-bold tracking-tight">1. Configuration</h2>

      <div className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium">Upload PDF</label>
          <PdfUploadZone selectedFile={file} onFileSelect={setFile} disabled={isRunning} />
        </div>

        <TextareaInput
          label="User Instruction"
          value={instruction}
          onChange={setInstruction}
          disabled={isRunning}
        />

        <TextareaInput
          label="Expected JSON Schema"
          value={schema}
          onChange={setSchema}
          disabled={isRunning}
        />

        {status === "error" && (
          <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="font-medium break-words">{errorMessage}</span>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={onReset} variant="outline" className="flex-1" disabled={isRunning}>
            Reset Defaults
          </Button>
          <Button
            onClick={onExecute}
            disabled={isRunning}
            className="flex-1 bg-[#FF6F61] text-white hover:bg-[#FF6F61]/90"
          >
            {isRunning ? (
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
// 3. Execution Results Panel
// ------------------------------------------------------------------
function ExecutionResultsPanel({
  status,
  originalText,
  maskedText,
  extractedJson,
  unmaskedJson,
  elapsedTime, // <-- NEW: Receive elapsedTime
}: {
  status: Status;
  originalText: string;
  maskedText: string;
  extractedJson: any;
  unmaskedJson: any;
  elapsedTime: number;
}) {
  return (
    <section className="lg:col-span-7">
      <h2 className="mb-4 text-lg font-bold tracking-tight">2. Pipeline Execution</h2>

      {/* Top Status Banner */}
      <Card className="mb-6">
        <CardContent className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            {status === "running" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                <span className="text-sm">Executing Pipeline... Document passing to LLM...</span>
              </>
            ) : status === "complete" ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Pipeline Execution Complete!</span>
              </>
            ) : status === "error" ? (
              <>
                <AlertCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm text-red-600">Pipeline execution failed. Check the configuration panel.</span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                Upload a file and click Execute to run the pipeline.
              </span>
            )}
          </div>
          
          {/* NEW: Timer Display */}
          {(status === "running" || status === "complete") && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Timer className="h-4 w-4" />
              <span>{elapsedTime.toFixed(1)}s</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Show the architecture map when Idle */}
      {status === "idle" && (
        <PipelineVisualizer />
      )}

      {/* Existing Execution Results (Only shows when complete) */}
      {status === "complete" && (
        <>
          <div className="mb-6">
            <ExpandableCard 
              title={
                <div className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <Search className="h-4 w-4" />
                  Document Comparison
                </div>
              }
              copyText={`--- ORIGINAL TEXT ---\n${originalText}\n\n--- ANONYMIZED TEXT ---\n${maskedText}`}
            >
              <DocumentComparison original={originalText} anonymized={maskedText} />
            </ExpandableCard>
          </div>

          <div className="mb-6">
            <ExpandableCard 
              title={
                <div className="flex items-center gap-2 text-base font-semibold text-slate-800">
                  <Brain className="h-4 w-4" />
                  JSON Output Comparison
                </div>
              }
              copyText={`--- ANONYMIZED JSON ---\n${JSON.stringify(extractedJson, null, 2)}\n\n--- RESTORED JSON ---\n${JSON.stringify(unmaskedJson, null, 2)}`}
            >
              <JsonComparison 
                anonymizedJson={extractedJson} 
                restoredJson={unmaskedJson} 
              />
            </ExpandableCard>
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
  const [instruction, setInstruction] = useState(
    () => sessionStorage.getItem("template_instruction") || DEFAULT_INSTRUCTION
  );

  const [schema, setSchema] = useState(
    () => sessionStorage.getItem("template_schema") || DEFAULT_SCHEMA
  );

  useEffect(() => {
    sessionStorage.setItem("template_instruction", instruction);
  }, [instruction]);

  useEffect(() => {
    sessionStorage.setItem("template_schema", schema);
  }, [schema]); 

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [originalText, setOriginalText] = useState("");
  const [maskedText, setMaskedText] = useState("");
  const [extractedJson, setExtractedJson] = useState<any>(null);
  const [unmaskedJson, setUnmaskedJson] = useState<any>(null);

  // NEW: Timer State & Ref
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // NEW: Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleResetDefaults = () => {
    setInstruction(DEFAULT_INSTRUCTION);
    setSchema(DEFAULT_SCHEMA);
  };

  const handleFileChange = (newFile: File | null) => {
    setFile(newFile);
    if (status === "complete" || status === "error") {
      setStatus("idle");
      setErrorMessage("");
      setOriginalText("");
      setMaskedText("");
      setExtractedJson(null);
      setUnmaskedJson(null);
      setElapsedTime(0); // <-- NEW: Reset timer on new file
    }
  };

  const handleExecute = async () => {
    if (!file) {
      setErrorMessage("Please upload a PDF document first.");
      setStatus("error");
      return;
    }

    // Capture precise syntax location error if validation fails
    try {
      JSON.parse(schema);
    } catch (e: any) {
      setErrorMessage(`Invalid Expected JSON Schema format: ${e.message}`);
      setStatus("error");
      return;
    }

    setStatus("running");
    setErrorMessage("");
    
    // NEW: Start Timer
    setElapsedTime(0);
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime((Date.now() - startTime) / 1000);
    }, 100);

    try {
      const result = await processDocument({
        file,
        user_instruction: instruction,
        json_schema: schema,
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
    } finally {
      // NEW: Stop Timer when done (success or fail)
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-12">
          
          <ConfigurationPanel
            file={file}
            setFile={handleFileChange}
            instruction={instruction}
            setInstruction={setInstruction}
            schema={schema}
            setSchema={setSchema}
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
            elapsedTime={elapsedTime} // <-- NEW: Pass down timer state
          />

        </div>
      </main>
    </div>
  );
}

export default TemplateProcess;