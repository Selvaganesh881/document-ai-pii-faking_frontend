import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FolderOpen, Play, CheckCircle2, ArrowRight, Loader2, Clock } from "lucide-react";
import { TextareaInput } from "@/components/TextareaInput";

// Import the clean API client
import { processDocument } from "@/lib/api";

export const Route = createFileRoute("/bulk-processing")({
  head: () => ({
    meta: [{ title: "Bulk Processing — Document AI" }],
  }),
  component: BulkProcessing,
});

const DEFAULT_INSTRUCTIONS = `ROLE & OBJECTIVE:
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

function BulkProcessing() {
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  
  const [instructions, setInstructions] = useState(
    () => sessionStorage.getItem("doc_instructions") || DEFAULT_INSTRUCTIONS
  );

  const [jsonSchema, setJsonSchema] = useState(
    () => sessionStorage.getItem("doc_json_schema") || DEFAULT_SCHEMA
  );

  useEffect(() => {
    sessionStorage.setItem("doc_instructions", instructions);
  }, [instructions]);

  useEffect(() => {
    sessionStorage.setItem("doc_json_schema", jsonSchema);
  }, [jsonSchema]);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [liveElapsed, setLiveElapsed] = useState<number>(0);
  const [progress, setProgress] = useState({ current: 0, total: 0, complete: false, elapsedTime: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live timer tick during active processing
  useEffect(() => {
    let intervalId: any;
    if (isProcessing && startTime) {
      intervalId = setInterval(() => {
        setLiveElapsed(Math.round((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isProcessing, startTime]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const allFiles = Array.from(e.target.files);
      const pdfsOnly = allFiles.filter(file => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"));
      setPdfFiles(pdfsOnly);
      setProgress({ current: 0, total: 0, complete: false, elapsedTime: 0 });
    }
  };

  const startBulkProcess = async () => {
    if (pdfFiles.length === 0) return alert("Please select a folder with PDF files.");
    if (!instructions || !jsonSchema) return alert("Please provide instructions and a JSON schema.");

    const jobStart = Date.now();
    setStartTime(jobStart);
    setLiveElapsed(0);
    setIsProcessing(true);
    setProgress({ current: 0, total: pdfFiles.length, complete: false, elapsedTime: 0 });

    for (let i = 0; i < pdfFiles.length; i++) {
      const file = pdfFiles[i];

      try {
        const result = await processDocument({
          file: file,
          user_instruction: instructions,
          json_schema: jsonSchema
        });

        if (result.status === "error") {
          console.error(`Backend failed on ${file.name}:`, result.message);
          alert(`Error processing ${file.name}:\n\n${result.message}`);
          setIsProcessing(false);
          setStartTime(null);
          return; 
        }

      } catch (error) {
        console.error(`Network failure on ${file.name}:`, error);
        alert(`Network error processing ${file.name}. Check terminal!`);
        setIsProcessing(false);
        setStartTime(null);
        return;
      }

      setProgress(prev => ({ ...prev, current: i + 1 }));
    }

    const overallDuration = parseFloat(((Date.now() - jobStart) / 1000).toFixed(1));
    setIsProcessing(false);
    setStartTime(null);
    setProgress(prev => ({ ...prev, complete: true, elapsedTime: overallDuration }));
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Bulk Processing</h2>
          <p className="text-sm text-muted-foreground">
            Process entire directories of PDFs with a single prompt.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-[1fr_300px]">
          {/* Main Configuration Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Select PDFs</CardTitle>
                <CardDescription>Highlight multiple PDFs from your computer to process them in bulk.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                    disabled={isProcessing}
                  >
                    <FolderOpen className="h-4 w-4" />
                    Select PDFs
                  </Button>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,application/pdf"
                    multiple
                  />
                  
                  <div className="text-sm text-muted-foreground">
                    {pdfFiles.length > 0 ? (
                      <span className="flex items-center gap-2 text-green-600 font-medium">
                        <CheckCircle2 className="h-4 w-4" />
                        {pdfFiles.length} PDFs queued
                      </span>
                    ) : "No files selected"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Extraction Logic</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <TextareaInput
                  label="User Instructions"
                  value={instructions}
                  disabled={isProcessing}
                  onChange={(e: any) => typeof e === 'string' ? setInstructions(e) : setInstructions(e.target.value)}
                />

                <TextareaInput
                  label="Expected JSON Output (Schema)"
                  value={jsonSchema}
                  disabled={isProcessing}
                  onChange={(e: any) => typeof e === 'string' ? setJsonSchema(e) : setJsonSchema(e.target.value)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Actions */}
          <div>
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Execution</CardTitle>
                <CardDescription>Review and start the pipeline.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Dynamic UI: Ready -> Loading -> Success UI */}
                {progress.complete ? (
                  <div className="space-y-4 text-center py-4">
                    <div className="flex justify-center text-green-600 mb-2">
                      <CheckCircle2 className="h-12 w-12" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Job Complete</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Successfully processed {progress.total} files.
                      </p>
                      <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-md bg-slate-100 text-xs font-medium text-slate-700">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        Duration: {progress.elapsedTime}s
                      </div>
                    </div>
                    <Link to="/results" className="block w-full pt-2">
                      <Button className="w-full gap-2 bg-slate-800 hover:bg-slate-900 text-white">
                        Action Center <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ) : isProcessing ? (
                  <div className="space-y-4 py-2">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span className="flex items-center gap-2 text-blue-600">
                        <Loader2 className="h-4 w-4 animate-spin" /> Processing... ({liveElapsed}s)
                      </span>
                      <span>{progress.current} / {progress.total}</span>
                    </div>
                    {/* Live Progress Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border">
                      <div 
                        className="bg-blue-600 h-full transition-all duration-300 ease-out" 
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-2">
                      Please keep this tab open.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Target Files:</span>
                        <span className="font-medium">{pdfFiles.length}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Instructions:</span>
                        <span className="font-medium text-green-600">Loaded</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Schema:</span>
                        <span className="font-medium text-green-600">Loaded</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full gap-2 bg-blue-600 hover:bg-blue-700 transition-all" 
                      size="lg"
                      onClick={startBulkProcess}
                      disabled={pdfFiles.length === 0}
                    >
                      <Play className="h-4 w-4" />
                      Run Bulk Pipeline
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}