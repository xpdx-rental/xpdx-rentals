"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Truck, Inbox, MessageSquareQuote,
  Settings, Users, ScrollText, Menu, X, FileText, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
// Leads first: it is the landing screen and the thing staff open all day
// (CLAUDE.md §7). The dashboard, brands/models catalogue and API-usage screens
// went in Phase 1.
//
// No FAQ screen: the eighteen supplied FAQs are legally operative and live in
// `src/lib/content/faqs.ts` under review. The inherited screen wrote to a
// `faqs` table the public site had stopped reading, so an operator could edit
// an answer, see it save, and never see the site change.
const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/leads", label: "Leads", icon: Inbox },
  { href: "/admin/vans", label: "Fleet", icon: Truck },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/testimonials", label: "Testimonials", icon: MessageSquareQuote },
  { href: "/admin/seo", label: "SEO registry", icon: Search },
  { href: "/admin/settings", label: "Settings", icon: Settings },
  { href: "/admin/roles", label: "Users & Roles", icon: Users },
  { href: "/admin/audit", label: "Audit Log", icon: ScrollText },
];

export function AdminNav({ userEmail, role }: { userEmail?: string; role?: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Initialize the Supabase browser client on mount to handle background token
  // refreshes safely.
  useEffect(() => {
    createClient();
  }, []);

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const links = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map((item) => {
        const active = isActive(item.href);
        // Define links by permission tier
        const allowedRolesByRoute: Record<string, string[]> = {
          "/admin": ["owner", "super_admin", "admin", "manager", "hire_desk", "content"], // Dashboard
          "/admin/leads": ["owner", "super_admin", "admin", "manager", "hire_desk"],
          "/admin/vans": ["owner", "super_admin", "admin", "manager", "hire_desk"],
          "/admin/blog": ["owner", "super_admin", "manager", "content"],
          "/admin/testimonials": ["owner", "super_admin", "manager", "content"],
          "/admin/seo": ["owner", "super_admin"],
          "/admin/settings": ["owner", "super_admin", "admin"],
          "/admin/roles": ["owner", "super_admin"], // Only owner can see Roles
          "/admin/audit": ["owner", "super_admin"], // Only owner can see Audit
        };

        const normalizedRole = role === "super_admin" ? "owner" : (role || "");
        const allowed = allowedRolesByRoute[item.href];
        if (allowed && !allowed.includes(normalizedRole)) {
          return null;
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-border bg-card p-3 lg:hidden">
        <Link href="/admin/leads" className="font-heading text-lg font-extrabold text-foreground">XPDX <span className="text-link">Staff</span></Link>
        <button onClick={() => setOpen(!open)} aria-label="Toggle menu" className="rounded-lg p-2 text-foreground hover:bg-accent/50">
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Sidebar (desktop) / drawer (mobile) */}
      <aside
        className={cn(
          "flex w-64 flex-none flex-col bg-card border-r border-border lg:sticky lg:top-0 lg:h-screen",
          open ? "block" : "hidden lg:flex",
        )}
      >
        <div className="hidden items-center gap-2 border-b border-border p-4 lg:flex">
          <Link href="/admin/leads" className="font-heading text-lg font-extrabold text-foreground">XPDX <span className="text-link">Staff</span></Link>
        </div>
        {links}
        <div className="mt-auto border-t border-border p-4 text-xs text-muted-foreground">
          <p className="truncate text-foreground/80">{userEmail}</p>
          {role ? <p className="capitalize">{role.replace("_", " ")}</p> : null}
          <form method="POST" action="/auth/sign-out">
            <button type="submit" className="mt-2 inline-block text-muted-foreground hover:text-foreground">
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
