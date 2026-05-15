import posthog from "posthog-js";
import type { AnalyticsEvent, EventPayload } from "./types";

let initialized = false;

export function initAnalytics() {
  const key = import.meta.env.VITE_POSTHOG_KEY;
  if (!key) return;
  posthog.init(key, {
    api_host: "https://us.i.posthog.com",
    capture_pageview: true,
    capture_pageleave: true,
    autocapture: false,
    persistence: "localStorage+cookie",
    respect_dnt: true,
    session_recording: { maskAllInputs: true },
  });
  initialized = true;
}

export function identifyUser(
  uid: string,
  traits: { plan: "byok"; totalDreams: number; signupDate: string }
) {
  if (!initialized) return;
  posthog.identify(uid, traits);
}

export const analytics = {
  capture<K extends AnalyticsEvent["event"]>(event: K, properties: EventPayload<K>): void {
    if (!initialized) return;
    posthog.capture(event, properties as Record<string, unknown>);
  },
};
