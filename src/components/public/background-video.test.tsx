/**
 * @vitest-environment jsdom
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { BackgroundVideo } from "@/components/public/background-video";

/**
 * These heroes are decorative: `aria-hidden`, muted, looping, and nothing on
 * the page depends on them. The whole point of this component is that the
 * ~7.4 MB of clips behind them stop being fetched at high priority on first
 * paint. So what is worth pinning is exactly *when* a `<video>` is allowed to
 * exist at all.
 *
 * These are also the tests that would have caught the bug found while verifying
 * this work in a browser: the first version gated on framer-motion's
 * `useReducedMotion()`, which samples once and can remain `null` after
 * hydration — so the gate never opened and every hero was silently reduced to a
 * still poster, on every visit, with no error anywhere.
 */

type IOCallback = (entries: { isIntersecting: boolean }[]) => void;

let observers: { cb: IOCallback; disconnect: () => void }[] = [];
let matchesReducedMotion = false;
let connection: { saveData?: boolean; effectiveType?: string } | undefined;

function triggerIntersection() {
  // `act` because the callback lands in React state.
  act(() => {
    for (const o of observers) o.cb([{ isIntersecting: true }]);
  });
}

beforeEach(() => {
  observers = [];
  matchesReducedMotion = false;
  connection = undefined;

  vi.stubGlobal(
    "IntersectionObserver",
    class {
      constructor(cb: IOCallback) {
        observers.push({ cb, disconnect: () => {} });
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );

  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("prefers-reduced-motion") ? matchesReducedMotion : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));

  // Run the deferred start synchronously so the tests do not depend on idle
  // scheduling; the timing is not what is under test, the gating is.
  vi.stubGlobal("requestIdleCallback", (cb: () => void) => {
    cb();
    return 1;
  });
  vi.stubGlobal("cancelIdleCallback", () => {});

  Object.defineProperty(window.navigator, "connection", {
    configurable: true,
    get: () => connection,
  });

  // jsdom has no media element implementation.
  window.HTMLMediaElement.prototype.play = vi.fn(() => Promise.resolve());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function renderHero() {
  return render(
    <BackgroundVideo src="/videos/hero-van.mp4" poster="/business-hero-poster.jpg" />,
  );
}

describe("BackgroundVideo", () => {
  it("paints the poster and requests no video before intersection", () => {
    const { container } = renderHero();

    // The poster is what the visitor actually sees first, and on most pages it
    // is the LCP element.
    expect(container.querySelector("img")).not.toBeNull();
    expect(container.querySelector("video")).toBeNull();
  });

  it("loads the clip once the hero is near the viewport", () => {
    const { container } = renderHero();
    triggerIntersection();

    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    expect(video?.getAttribute("src")).toBe("/videos/hero-van.mp4");
    // Still "none": we have already decided to fetch, so this only stops the
    // browser buffering further ahead than playback needs.
    expect(video?.getAttribute("preload")).toBe("none");
  });

  it("never loads the clip under prefers-reduced-motion", () => {
    matchesReducedMotion = true;
    const { container } = renderHero();
    triggerIntersection();

    // Poster only. A still frame is the correct reduced-motion experience, and
    // it costs no video bandwidth at all — the previous implementation
    // downloaded the clip and then called pause() on it.
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("never loads the clip when Save-Data is on", () => {
    connection = { saveData: true, effectiveType: "4g" };
    const { container } = renderHero();
    triggerIntersection();

    expect(container.querySelector("video")).toBeNull();
  });

  it.each(["slow-2g", "2g"])("never loads the clip on a %s connection", (effectiveType) => {
    connection = { saveData: false, effectiveType };
    const { container } = renderHero();
    triggerIntersection();

    expect(container.querySelector("video")).toBeNull();
  });

  it("still loads on a fast connection, and where the API is unavailable", () => {
    connection = { saveData: false, effectiveType: "4g" };
    const { container: fast } = renderHero();
    triggerIntersection();
    expect(fast.querySelector("video")).not.toBeNull();

    observers = [];
    connection = undefined; // Safari/Firefox: navigator.connection is absent
    const { container: unknown } = renderHero();
    triggerIntersection();
    expect(unknown.querySelector("video")).not.toBeNull();
  });

  it("falls back to the poster when the clip fails to load", () => {
    const { container } = renderHero();
    triggerIntersection();

    const video = container.querySelector("video")!;
    act(() => {
      video.dispatchEvent(new Event("error"));
    });

    // A dead CDN or a corrupt file must leave the hero looking finished, not
    // black.
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")).not.toBeNull();
  });

  it("keeps the decorative clip out of the accessibility tree", () => {
    const { container } = renderHero();
    triggerIntersection();

    const video = container.querySelector("video")!;
    expect(video.getAttribute("aria-hidden")).toBe("true");
    expect(video.getAttribute("tabindex")).toBe("-1");
    // An empty alt on a decorative poster, so a screen reader does not announce
    // it alongside the real heading the hero already carries. Scoped to this
    // render's container rather than `screen`, which queries the whole document.
    const poster = container.querySelector("img")!;
    expect(poster.getAttribute("alt")).toBe("");
    expect(poster.getAttribute("aria-hidden")).toBe("true");
  });
});
