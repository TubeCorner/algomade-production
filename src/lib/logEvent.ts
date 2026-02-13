export async function logEvent(eventName: string, metadata?: any) {
  try {
    await fetch("/api/log-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventName,
        metadata,
      }),
    });
  } catch (err) {
    console.error("Event log failed:", err);
  }
}
