import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useDeferredValue } from "react";
import React from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, ChevronDown, ChevronRight, Trash2, Maximize2, X } from "lucide-react";

import { DocumentComparison } from "@/components/DocumentComparison";
import { JsonComparison } from "@/components/JsonComparison";

// Cleaned up unified imports
import { getResults, deleteResult, type ResultRow } from "@/lib/api";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Action Center — Document AI" },
      {
        name: "description",
        content: "Browse historical extraction results from the document AI pipeline.",
      },
    ],
  }),
  component: Results,
});

function Results() {
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Instant state for the input box
  const [query, setQuery] = useState("");
  // Delayed state for the heavy table filtering
  const deferredQuery = useDeferredValue(query);
  
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Maximization viewing state
  const [maximizedView, setMaximizedView] = useState<{
    type: "document" | "json";
    row: ResultRow;
  } | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getResults(controller.signal)
      .then((r) => {
        if (r.status === "success") setRows(r.results);
      })
      .catch((err) => console.error("Failed to load results:", err))
      .finally(() => setIsLoading(false));
    return () => controller.abort();
  }, []);

  // Filter using the DEFERRED query
  const filtered = rows.filter((r) =>
    r.original_filename?.toLowerCase().includes(deferredQuery.toLowerCase()),
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (expandedId) setExpandedId(null); 
  };

  const handleDelete = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation(); // Prevents the row from expanding/collapsing when clicking the trash icon
    
    if (!window.confirm("Are you sure you want to permanently delete this record?")) return;

    try {
      await deleteResult(id);
      setRows(prevRows => prevRows.filter(row => row.id !== id));
      
      // If they deleted the row while it was open, reset the expanded state
      if (expandedId === id) setExpandedId(null);
    } catch (error) {
      console.error("Failed to delete record:", error);
      alert("Failed to delete the record. Check backend connection.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Action Center</h2>
            <p className="text-sm text-muted-foreground">
              Validation & Monitoring
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            
            <Input
              placeholder="Search documents…"
              className="pl-9"
              value={query}
              onChange={handleSearch}
              autoComplete="off"
              spellCheck={false}
              data-1p-ignore="true"
              data-lpignore="true"
              data-form-type="other"
            />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extractions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      Loading historical data…
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                      No results found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((r) => {
                    const isExpanded = expandedId === r.id; 

                    return (
                      <React.Fragment key={r.id}>
                        {/* MAIN ROW */}
                        <TableRow 
                          className="cursor-pointer hover:bg-muted/30 transition-colors"
                          onClick={() => toggleExpand(r.id)}
                        >
                          <TableCell>
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </TableCell>
                          <TableCell className="font-medium text-blue-600">
                            {r.original_filename}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {r.created_at ? new Date(r.created_at).toLocaleString() : 'Unknown Date'}
                          </TableCell>
                          <TableCell>
                            {r.status === "complete" ? (
                              <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                complete
                              </Badge>
                            ) : (
                              <Badge variant="destructive">{r.status || 'error'}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <button
                              onClick={(e) => handleDelete(e, r.id)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>

                        {/* EXPANDED CONTENT ROW */}
                        {isExpanded && (
                          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                            <TableCell colSpan={5} className="p-0">
                              <div className="p-6 border-b shadow-inner">
                                <h4 className="mb-4 text-sm font-bold text-slate-800">Pipeline Output Details</h4>
                                
                                <div className="space-y-6">
                                  {r.original_text && r.masked_text ? (
                                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                                      <div className="flex justify-between items-center mb-3">
                                        <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Text Extraction & Masking</h5>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 gap-1 text-slate-500 hover:text-slate-900"
                                          onClick={() => setMaximizedView({ type: "document", row: r })}
                                        >
                                          <Maximize2 className="h-3.5 w-3.5" /> Maximize
                                        </Button>
                                      </div>
                                      <DocumentComparison 
                                        original={r.original_text} 
                                        anonymized={r.masked_text} 
                                      />
                                    </div>
                                  ) : null}

                                  {r.extracted_json && r.unmasked_json ? (
                                    <div className="bg-white p-4 rounded-lg border shadow-sm">
                                      <div className="flex justify-between items-center mb-3">
                                        <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Structured JSON Output</h5>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-7 gap-1 text-slate-500 hover:text-slate-900"
                                          onClick={() => setMaximizedView({ type: "json", row: r })}
                                        >
                                          <Maximize2 className="h-3.5 w-3.5" /> Maximize
                                        </Button>
                                      </div>
                                      <JsonComparison 
                                        anonymizedJson={r.extracted_json} 
                                        restoredJson={r.unmasked_json} 
                                      />
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* FULL SCREEN MAXIMIZED VIEW MODAL PORTAL */}
      {maximizedView && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b px-6 py-4 bg-slate-50">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <span className="text-blue-600">{maximizedView.row.original_filename}</span>
                <span className="text-slate-400 font-normal">/</span>
                <span className="text-sm font-medium text-slate-500 capitalize">
                  {maximizedView.type === "document" ? "Text Comparison View" : "JSON Properties Structure"}
                </span>
              </h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMaximizedView(null)}
              className="gap-1.5 shadow-sm"
            >
              <X className="h-4 w-4" /> Close Panel
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 max-w-[1600px] mx-auto w-full">
            <div className="h-full bg-white rounded-xl border p-6 shadow-sm overflow-y-auto">
              {maximizedView.type === "document" ? (
                <DocumentComparison 
                  original={maximizedView.row.original_text!} 
                  anonymized={maximizedView.row.masked_text!} 
                />
              ) : (
                <JsonComparison 
                  anonymizedJson={maximizedView.row.extracted_json!} 
                  restoredJson={maximizedView.row.unmasked_json!} 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}