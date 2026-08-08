"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/brand-logo";

/** Staff-only sign-in (there are no buyer accounts). Email + password. */
export function StaffSignIn() {
  const params = useSearchParams();
  const redirectedFrom = params.get("redirectedFrom");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }
    // Full navigation so the server picks up the new session cookies.
    window.location.href = redirectedFrom || "/admin";
  }

  return (
    <div className="w-full max-w-md rounded-3xl border border-white/10 bg-black/40 p-8 sm:p-12 backdrop-blur-2xl shadow-2xl ring-1 ring-white/5">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-6 flex justify-center drop-shadow-md">
          <BrandLogo imageClassName="h-14 w-auto" />
        </div>
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight drop-shadow-md">Staff Login</h1>
        <p className="mt-2 text-sm font-medium text-white/60 uppercase tracking-widest">Authorized Access Only</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <label className="block group">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/70 group-focus-within:text-primary transition-colors">Email</span>
          <input
            type="email" required autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/20 backdrop-blur-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50"
            placeholder="admin@xpdx.com"
          />
        </label>
        <label className="block group">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-white/70 group-focus-within:text-primary transition-colors">Password</span>
          <input
            type="password" required autoComplete="current-password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-white/20 backdrop-blur-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary/50"
            placeholder="••••••••"
          />
        </label>
        {error ? (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 font-medium">
            {error}
          </div>
        ) : null}
        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/40 disabled:opacity-50"
        >
          {loading ? <Loader2 className="size-5 animate-spin" /> : "Sign in to Portal"}
        </button>
      </form>

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10"></span>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-black/20 px-2 text-white/40">Or continue with</span>
        </div>
      </div>

      <button
        type="button"
        onClick={async () => {
          setLoading(true);
          const supabase = createClient();
          const next = redirectedFrom || "/admin";
          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
              queryParams: { prompt: "select_account" }
            },
          });
          if (error) {
            setError(error.message);
            setLoading(false);
          }
        }}
        disabled={loading}
        className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 font-bold text-white hover:bg-white/10 disabled:opacity-60 transition-all backdrop-blur-sm shadow-md"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Google
      </button>
    </div>
  );
}
