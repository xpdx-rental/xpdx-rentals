import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp } from "@/lib/security/rate-limit";
import { rateLimitSlidingWindow } from "@/lib/security/rate-limit-redis";

export const runtime = "nodejs";

// Fire-and-forget click tracking for Call / WhatsApp CTAs. CLAUDE.md §9 counts
// these as conversions. Appends to `cta_clicks` via the record_cta_click RPC.
const schema = z.object({
  vanId: z.string().uuid().optional(),
  channel: z.enum(["call", "whatsapp", "enquire"]),
  pagePath: z.string().max(512).optional(),
});

export async function POST(request: NextRequest) {
  // Rate limit: 20 click events per minute per IP.
  // Prevents bots from inflating CTA conversion counts.
  const ip = clientIp(request.headers);
  const rl = await rateLimitSlidingWindow(`cta:${ip}`, 20, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter ?? 60) } },
    );
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });

  const supabase = createAdminClient();
  await supabase.rpc("record_cta_click", {
    p_van_id: parsed.data.vanId ?? null,
    p_channel: parsed.data.channel,
    p_page_path: parsed.data.pagePath ?? null,
  });
  return NextResponse.json({ ok: true });
}
