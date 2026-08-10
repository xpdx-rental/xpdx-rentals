import { createAdminClient } from "@/lib/supabase/admin";
import { Activity, Eye, Inbox, MousePointerClick, Truck, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { AnalyticsCharts } from "@/components/admin/analytics-charts";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  const supabase = createAdminClient();

  // Fetch basic stats (with error handling so it doesn't crash if something is wrong)
  const [{ count: leadCount }, { count: vanCount }, { count: activeVanCount }, { data: recentLeads }] = await Promise.all([
    supabase.from("leads").select("*", { count: "exact", head: true }),
    supabase.from("vans").select("*", { count: "exact", head: true }),
    // Fix: valid statuses are 'available' or 'limited', not 'published'
    supabase.from("vans").select("*", { count: "exact", head: true }).in("status", ["available", "limited"]),
    supabase
      .from("leads")
      .select("id, name, type, created_at, status")
      .order("created_at", { ascending: false })
      .limit(6)
  ]);

  // Aggregate page views and leads from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysIso = thirtyDaysAgo.toISOString();

  // Fetch real analytics data
  const [{ data: rawViews, error: viewsError }, { data: rawLeads }] = await Promise.all([
    supabase.from("page_views").select("created_at").gte("created_at", thirtyDaysIso),
    supabase.from("leads").select("created_at").gte("created_at", thirtyDaysIso),
  ]);

  // Group by date (yyyy-mm-dd)
  const groupedData: Record<string, { views: number; leads: number }> = {};
  
  // Initialize the past 30 days with 0s to ensure continuous charts
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    groupedData[dateStr] = { views: 0, leads: 0 };
  }

  // Populate actuals
  (rawViews || []).forEach(v => {
    const d = v.created_at.split("T")[0];
    if (groupedData[d]) groupedData[d].views++;
  });
  
  (rawLeads || []).forEach(l => {
    const d = l.created_at.split("T")[0];
    if (groupedData[d]) groupedData[d].leads++;
  });

  const dailyStats = Object.keys(groupedData)
    .sort()
    .map(date => ({
      date,
      views: groupedData[date].views,
      leads: groupedData[date].leads,
    }));

  const totalViews = (rawViews || []).length;
  const recentViews = dailyStats.slice(-7).reduce((acc, curr) => acc + curr.views, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col gap-2 relative">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground relative z-10">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground max-w-2xl font-medium relative z-10">
          Real-time analytics and recent activity at a glance.
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:bg-accent/30 hover:border-primary/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">Total Leads</h3>
            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Inbox className="size-5 text-primary" />
            </div>
          </div>
          <p className="text-4xl font-black text-foreground">{leadCount ?? 0}</p>
          <p className="mt-2 text-xs font-semibold text-emerald-400">Total lifetime enquiries</p>
        </div>

        <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:bg-accent/30 hover:border-blue-500/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-blue-400 transition-colors">Page Views (30d)</h3>
            <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
              <Eye className="size-5 text-blue-400" />
            </div>
          </div>
          <p className="text-4xl font-black text-foreground">{totalViews}</p>
          <p className="mt-2 text-xs font-semibold text-blue-400">{recentViews} in the last 7 days</p>
        </div>

        <div className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:bg-accent/30 hover:border-amber-500/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-amber-400 transition-colors">Active Fleet</h3>
            <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
              <Truck className="size-5 text-amber-400" />
            </div>
          </div>
          <p className="text-4xl font-black text-foreground">{activeVanCount ?? 0} <span className="text-lg text-muted-foreground font-medium">/ {vanCount ?? 0}</span></p>
          <p className="mt-2 text-xs font-semibold text-amber-400">Vans ready for hire</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Analytics Chart */}
        <div className="col-span-1 lg:col-span-2 rounded-2xl border border-border bg-card/40 p-6 shadow-sm backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Traffic & Conversion</h3>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-muted-foreground"><div className="w-2 h-2 rounded-full bg-primary" /> Views</span>
              <span className="flex items-center gap-1.5 text-muted-foreground"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Leads</span>
            </div>
          </div>
          <AnalyticsCharts stats={dailyStats} />
        </div>

        {/* Recent Activity */}
        <div className="col-span-1 rounded-2xl border border-border bg-card/40 p-6 shadow-sm backdrop-blur-md flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-foreground">Recent Leads</h3>
            <Activity className="size-5 text-primary" />
          </div>
          
          <div className="flex-1 space-y-4">
            {recentLeads?.length ? (
              recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between group rounded-xl p-3 border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-colors">
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-bold text-foreground truncate">{lead.name}</span>
                    <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                      {lead.type.replace("_", " ")}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 ml-3">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      lead.status === 'unread' || lead.status === 'new' ? 'bg-primary/20 text-primary border-primary/30' : 
                      lead.status === 'won' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                      'bg-secondary text-secondary-foreground border-border'
                    }`}>
                      {lead.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {new Date(lead.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-8 opacity-50">
                <Inbox className="size-10 mb-3" />
                <p className="text-sm font-semibold">No leads yet</p>
                <p className="text-xs">Incoming enquiries will appear here.</p>
              </div>
            )}
          </div>
          
          <Link href="/admin/leads" className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors w-full rounded-xl bg-primary/10 py-3">
            View All Enquiries
          </Link>
        </div>
      </div>
    </div>
  );
}
