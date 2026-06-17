import { Link } from "@tanstack/react-router";
import { LayoutDashboard, Workflow, Database, Sparkles, Layers } from "lucide-react";

const tabs = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/template-process", label: "Template & Process", icon: Workflow, exact: false },
  { to: "/bulk-processing", label: "Bulk Processing", icon: Layers, exact: false },
  { to: "/results", label: "Action Center", icon: Database, exact: false },
] as const;

export function AppHeader() {
  return (
    <header className="border-b bg-card">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Document AI
            </h1>
            <p className="text-xs text-muted-foreground">
              Field Extraction with PII Faking &amp; LLMs
            </p>
          </div>
        </div>

        <nav className="mt-5 flex gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                activeOptions={{ exact: t.exact }}
                inactiveProps={{
                  className: "border-transparent text-muted-foreground hover:text-foreground"
                }}
                activeProps={{
                  className: "border-coral text-foreground"
                }}
                className="flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors"
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}