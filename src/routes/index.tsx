import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ShieldCheck, Database, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Document AI" },
      {
        name: "description",
        content:
          "Overview of document extraction pipeline runs, PII anonymization, and LLM extraction results.",
      },
    ],
  }),
  component: Dashboard,
});

const stats = [
  { label: "Documents Processed", value: "1,284", icon: FileText },
  { label: "PII Entities Masked", value: "8,471", icon: ShieldCheck },
  { label: "Records in Database", value: "1,206", icon: Database },
];

function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Pipeline health and recent extraction activity.
            </p>
          </div>
          <Button asChild className="bg-coral text-white hover:bg-coral/90">
            <Link to="/template-process">
              New Extraction
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {s.label}
                </CardTitle>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent runs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Pipeline run history will appear here once the backend is connected.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
