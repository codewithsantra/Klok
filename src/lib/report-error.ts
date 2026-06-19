// Centralized error reporting. Always logs to the server console; if
// ERROR_WEBHOOK_URL is set (Sentry, Slack/Discord webhook, Logflare, etc.)
// it also forwards a compact JSON payload. No SDK dependency.

type ErrorContext = Record<string, unknown>;

export async function reportError(error: unknown, context?: ErrorContext): Promise<void> {
  const payload = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    at: new Date().toISOString(),
    env: process.env.NODE_ENV,
    ...context,
  };

  console.error("[reportError]", payload.message, payload);

  const url = process.env.ERROR_WEBHOOK_URL;
  if (!url) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.error("[reportError] webhook delivery failed:", e);
  }
}
