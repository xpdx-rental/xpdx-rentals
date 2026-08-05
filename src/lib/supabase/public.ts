import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { requireEnv } from "@/lib/config";

/**
 * Anonymous, cookie-free Supabase client for the public site.
 *
 * The SSR client in `server.ts` reads `cookies()` to resolve a session. On a
 * login-free public site there is no session to resolve, and touching
 * `cookies()` opts the whole route out of static rendering — which is how
 * `/`, `/vans` and the three service pages ended up server-rendered on every
 * request. CLAUDE.md §8 wants them static.
 *
 * This client uses the anon key with no session persistence, so:
 *   • RLS still applies — draft vans remain invisible, and `leads` remains
 *     unreadable. Postgres enforces it, not application code.
 *   • Pages can be statically generated and revalidated on a timer.
 *
 * Never use this for anything a signed-in user's identity affects, and never
 * use the service-role client on the public site (§1.10).
 */
/**
 * Hard timeout on every request.
 *
 * Without it, an unreachable database does not fail — it hangs, and the page
 * sits in its loading state indefinitely instead of falling through to the
 * empty state and the phone number. For a site whose entire purpose is
 * capturing enquiries, degrading in five seconds is enormously better than
 * hanging: the fleet grid is nice to have, the call button is the business.
 */
const REQUEST_TIMEOUT_MS = 5000;

export function createPublicClient() {
  return createSupabaseClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) =>
          fetch(input, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }),
      },
    },
  );
}
