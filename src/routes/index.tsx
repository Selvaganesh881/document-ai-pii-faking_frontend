import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ShieldCheck, Database, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Document AI" },
      { name: "description", content: "Overview of document extraction pipeline runs." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  // 1. Set up state variables to hold our live database data
  const [dashboardData, setDashboardData] = useState({
    documents_processed: 0,
    entities_masked: 0,
    records_in_db: 0
  });
  const [recentRuns, setRecentRuns] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 2. Fetch data from FastAPI when the component loads
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/dashboard-stats");
        const result = await response.json();
        
        if (result.status === "success") {
          setDashboardData(result.stats);
          setRecentRuns(result.recent_runs);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []); // Empty array means this runs exactly once on page load

  // 3. Dynamically map the icons to the live data
  const stats = [
    { label: "Documents Processed", value: dashboardData.documents_processed, icon: FileText },
    { label: "PII Entities Masked", value: dashboardData.entities_masked, icon: ShieldCheck },
    { label: "Records in Database", value: dashboardData.records_in_db, icon: Database },
  ];

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

        {/* --- STATS CARDS --- */}
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
                <div className="text-2xl font-bold">
                  {isLoading ? "..." : s.value.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* --- RECENT RUNS TABLE --- */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent runs</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading database records...</p>
            ) : recentRuns.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pipeline runs found. Start a new extraction!</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase border-b">
                    <tr>
                      <th className="px-4 py-3">Filename</th>
                      <th className="px-4 py-3">Entities Masked</th>
                      <th className="px-4 py-3">Processed Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRuns.map((run, idx) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3 font-medium">{run.original_filename}</td>
                        <td className="px-4 py-3">
                          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                            {run.entity_count}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {new Date(run.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}