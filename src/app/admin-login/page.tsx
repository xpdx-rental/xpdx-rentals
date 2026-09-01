import { Suspense } from "react";
import { StaffSignIn } from "@/components/auth/staff-sign-in";
import { BackgroundVideo } from "@/components/public/background-video";

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
  robots: { index: true, follow: true },
};

export default function AdminLoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-black px-4 py-12 overflow-hidden">
      <div className="absolute inset-0 z-0">
        {/*
          Staff sign-in. The backdrop is pure decoration on a page whose only
          job is to authenticate someone, so the 3 MB clip is deferred behind
          the poster exactly as on the public heroes — and `priority` is off,
          because nothing here should out-rank the sign-in form itself.
        */}
        <div className="absolute inset-0 opacity-60">
          <BackgroundVideo
            src="/videos/hero-van.mp4"
            poster="/vans/sprinter-l2h2.jpg"
            className="size-full"
            priority={false}
          />
        </div>
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />
        <div className="absolute left-0 top-0 h-[60vh] w-[60vw] bg-primary/30 blur-[160px] mix-blend-screen opacity-50 pointer-events-none" />
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <Suspense fallback={<div className="h-96" />}>
          <StaffSignIn />
        </Suspense>
      </div>
    </main>
  );
}
