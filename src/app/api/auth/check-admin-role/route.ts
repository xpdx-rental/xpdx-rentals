import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAllowlistedAdminEmail } from "@/lib/security/admin-allowlist";

/**
 * POST /api/auth/check-admin-role
 *
 * Called immediately after a successful email/password sign-in to verify
 * the user has an active record in the admin_roles table (or is on the
 * owner email allowlist). The client signs them out and shows an error
 * if this returns { authorized: false }.
 *
 * This endpoint uses the service-role key so it bypasses RLS and can
 * safely query admin_roles without needing the user's own JWT.
 *
 * Body: { userId: string; email: string }
 * Response: { authorized: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email } = body as { userId?: string; email?: string };

    if (!userId) {
      return NextResponse.json({ authorized: false }, { status: 400 });
    }

    // System-owner emails on the allowlist are always authorized.
    if (isAllowlistedAdminEmail(email)) {
      return NextResponse.json({ authorized: true });
    }

    // All other users must have an active record in admin_roles.
    const adminSupabase = createAdminClient();
    const { data } = await adminSupabase
      .from("admin_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("active", true)
      .maybeSingle();

    return NextResponse.json({ authorized: !!data });
  } catch {
    return NextResponse.json({ authorized: false }, { status: 500 });
  }
}
