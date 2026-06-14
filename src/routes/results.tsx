import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Result Database — Document AI" },
      {
        name: "description",
        content: "Browse historical extraction results from the document AI pipeline.",
      },
    ],
  }),
  component: Results,
});

const rows = [
  {
    id: "r_001",
    doc: "test_word_01.pdf",
    date: "2026-06-14 10:24",
    status: "complete",
    holder: "David Mcguire",
    balance: 683242,
  },
  {
    id: "r_002",
    doc: "invoice_q2_apr.pdf",
    date: "2026-06-13 17:08",
    status: "complete",
    holder: "Sarah Lin",
    balance: 12480,
  },
  {
    id: "r_003",
    doc: "statement_2026_03.pdf",
    date: "2026-06-12 09:55",
    status: "failed",
    holder: "—",
    balance: null,
  },
];

function Results() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Result Database</h2>
            <p className="text-sm text-muted-foreground">
              All persisted extraction outputs.
            </p>
          </div>
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search documents…" className="pl-9" />
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent extractions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Account Holder</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.doc}</TableCell>
                    <TableCell className="text-muted-foreground">{r.date}</TableCell>
                    <TableCell>{r.holder}</TableCell>
                    <TableCell className="text-right font-mono">
                      {r.balance !== null ? r.balance.toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      {r.status === "complete" ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                          complete
                        </Badge>
                      ) : (
                        <Badge variant="destructive">failed</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
