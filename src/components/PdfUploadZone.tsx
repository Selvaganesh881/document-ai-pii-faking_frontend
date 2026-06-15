import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PdfUploadZone({ onFileSelect }: { onFileSelect?: (file: File | null) => void }) {
  // 1. Remove the mock data and store the actual File object
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onPick = (f: File | undefined) => {
    if (!f) return;
    setFile(f);
    // 2. Send the actual file up to the parent page
    if (onFileSelect) {
      onFileSelect(f);
    }
  };

  const handleRemove = () => {
    setFile(null);
    // Tell the parent page the file was cleared
    if (onFileSelect) {
      onFileSelect(null); 
    }
    // Clear the hidden input so the user can select the same file again if they want
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0])}
      />
      {file ? (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-background text-muted-foreground">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              Replace
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed bg-muted/30 p-8 text-center transition-colors hover:bg-muted/50"
        >
          <Upload className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">Upload financial PDF</p>
          <p className="text-xs text-muted-foreground">Click to browse — max 20MB</p>
        </button>
      )}
    </div>
  );
}