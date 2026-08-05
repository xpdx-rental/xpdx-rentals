import { redirect } from "next/navigation";

// Phase 1 removed the admin dashboard (KPI cards, funnel charts, and the
// get_admin_dashboard_metrics RPC behind them). Six vans and a lead list do not
// need analytics — CLAUDE.md §7. The leads inbox is the portal's landing screen.
export default function AdminIndexPage() {
  redirect("/admin/leads");
}
