import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Maximize2, Minimize2, Check } from "lucide-react";

type Props = {
  title: React.ReactNode;
  titleClassName?: string;
  children: React.ReactNode;
  copyText?: string;
};

export function ExpandableCard({ title, titleClassName, children, copyText }: Props) {
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