import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const { pathname } = await request.json();
    if (!pathname) return NextResponse.json({ error: "Missing pathname" }, { status: 400 });

    const userAgent = request.headers.get("user-agent") || "unknown";
    // IP hash to anonymously uniquely identify visitors without storing raw IP (GDPR friendly)
    const ip = request.headers.get("x-forwarded-for") || request.ip || "127.0.0.1";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex").slice(0, 16);

    const supabase = createAdminClient();

    // Use maybeSingle or just insert without waiting
    await supabase.from("page_views").insert({
      page_path: pathname,
      user_agent: userAgent,
      ip_hash: ipHash
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Analytics] Error tracking view:", err);
    // Fail silently for analytics so it doesn't break client if db fails
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
