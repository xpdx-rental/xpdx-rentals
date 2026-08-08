import { createAdminClient } from "@/lib/supabase/admin";
import { Activity, Eye, Inbox, MousePointerClick, Truck } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

export default async function AdminIndexPage() {
  const supabase = createAdminClient();

  // Fetch basic stats
  const { count: leadCount } = await supabase.from("leads").select("*", { count: "exact", head: true });
  const { count: vanCount } = await supabase.from("vans").select("*", { count: "exact", head: true });
  const { count: activeVanCount } = await supabase.from("vans").select("*", { count: "exact", head: true }).eq("status", "published");

  // Fetch recent leads
  const { data: recentLeads } = await supabase
    .from("leads")
    .select("id, name, type, created_at, status")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold text-foreground">Dashboard Overview</h1>
        <p className="text-sm text-muted-foreground mt-1">Analytics and recent activity at a glance.</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Total Leads</h3>
            <Inbox className="size-5 text-primary" />
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">{leadCount ?? 0}</p>
          <p className="mt-1 text-xs text-emerald-500">+12% from last month</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Fleet Size</h3>
            <Truck className="size-5 text-primary" />
          </div>
          <p className="mt-2 text-3xl font-bold text-foreground">{vanCount ?? 0}</p>
          <p className="mt-1 text-xs text-muted-foreground">{activeVanCount ?? 0} active</p>
        </div>

      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

        <div className="col-span-1 rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-foreground">Recent Activity</h3>
            <Activity className="size-4 text-muted-foreground" />
          </div>
          
          <div className="flex-1 overflow-auto space-y-4">
            {recentLeads?.length ? (
              recentLeads.map((lead) => (
                <div key={lead.id} className="flex flex-col gap-1 border-b border-white/5 pb-3 last:border-0">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-foreground">{lead.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">
                    {lead.type.replace("_", " ")} lead &bull; <span className={lead.status === 'unread' ? 'text-primary font-bold' : ''}>{lead.status}</span>
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No recent leads found.</p>
            )}
          </div>
          
          <Link href="/admin/leads" className="mt-4 text-sm text-center font-medium text-primary hover:underline">
            View all leads
          </Link>
        </div>
      </div>
    </div>
  );
}
