import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSafeRedirectPath } from "@/lib/routing";
import { deriveProfileFromUser } from "@/lib/auth/profile";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next");

  // Only staff authenticate; send them to their intended admin page or the panel.
  const destination = rawNext && isSafeRedirectPath(rawNext) ? rawNext : "/admin";

  const supabase = await createClient();

  // ─── OAuth Code Exchange ──────────────────────────────────────────────────
  // This block only runs when Google (or another OAuth provider) redirects back
  // with a one-time `code`. Email/password sign-ins do NOT pass a code here.
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("OAuth exchange failed:", error.message);
      return NextResponse.redirect(
        new URL("/admin-login?error=auth_failed", requestUrl.origin),
      );
    }

    if (data.user) {
      const { userHasAdminAccess } = await import("@/lib/security/auth");
      const hasAccess = await userHasAdminAccess(data.user);

      if (!hasAccess) {
        // Not authorized. Sign them out so they don't have an active session,
        // but their Supabase Auth user is created so the owner can assign them a role later.
        await supabase.auth.signOut();
        return NextResponse.redirect(new URL("/admin-login?error=unauthorized", requestUrl.origin));
      }

      const admin = createAdminClient();
      await admin.from("profiles").upsert(deriveProfileFromUser(data.user));
    }
  }

  return NextResponse.redirect(new URL(destination, requestUrl.origin));
}
