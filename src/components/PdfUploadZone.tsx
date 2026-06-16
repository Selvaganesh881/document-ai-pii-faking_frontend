import { useRef, useState } from "react";
import { FileText, Upload, X, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const MAX_FILE_SIZE_MB = 20;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type Props = {
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
  disabled?: boolean;
};

export function PdfUploadZone({ selectedFile, onFileSelect, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidationAndSetFile = (f: File) => {
    if (disabled) return;
    setError(null);

    if (f.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }

    if (f.size > MAX_FILE_SIZE_BYTES) {
      setError(`File size exceeds the ${MAX_FILE_SIZE_MB}MB limit.`);
      return;
    }

    onFileSelect(f);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleValidationAndSetFile(f);
  };

  const handleRemove = () => {
    if (disabled) return;
    onFileSelect(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) handleValidationAndSetFile(f);
  };

  return (
    <div className={`w-full ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled}
      />
      
      {selectedFile ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center gap-3 truncate">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md bg-background text-muted-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div className="truncate pr-4">
              <p className="text-sm font-medium text-foreground truncate">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()} disabled={disabled}>
              Replace
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRemove} aria-label="Remove file" disabled={disabled}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
            isDragging 
              ? "border-blue-500 bg-blue-50/50" 
              : "border-slate-300 bg-muted/30 hover:bg-muted/50"
          }`}
        >
          <Upload className={`h-6 w-6 ${isDragging ? "text-blue-500" : "text-muted-foreground"}`} />
          <p className="text-sm font-medium text-foreground">
            {isDragging ? "Drop PDF here" : "Upload financial PDF"}
          </p>
          <p className="text-xs text-muted-foreground">
            Click or drag and drop — max {MAX_FILE_SIZE_MB}MB
          </p>
        </div>
      )}

      {error && (
        <div className="mt-2 flex items-center gap-2 text-xs font-medium text-red-500">
          <AlertCircle className="h-3 w-3" />
          {error}
        </div>
      )}
    </div>
  );
}