import { Suspense } from "react";
import { StaffSignIn } from "@/components/auth/staff-sign-in";

/**
 * Staff sign-in — the portal's only entry point.
 *
 * Phase 1 collapsed two routes into this one. `/admin-login` used to be a bare
 * redirect to `/auth/sign-in`, which held the actual form alongside a half-page
 * marketing panel inherited from the previous build, whose copy described a
 * different business entirely. That panel was
 * advertising the business on a staff login screen is the opposite of what
 * CLAUDE.md §7 asks for — the portal should not market itself at all.
 *
 * `/admin-login` is now the real page; `/auth/sign-in` is gone.
 */
export const metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <StaffSignIn />
      </Suspense>
    </main>
  );
}
