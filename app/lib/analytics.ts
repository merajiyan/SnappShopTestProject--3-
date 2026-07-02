export function captureEvent(event: string, payload: Record<string, any> = {}) {
  if (typeof window === "undefined") {
    return;
  }

  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    page: window.location.pathname + window.location.search,
    ...payload,
  });

  const url = "/api/analytics";
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon(url, blob);
    return;
  }

  void fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
