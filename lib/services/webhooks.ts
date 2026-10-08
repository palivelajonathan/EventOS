/**
 * Outbound Webhook Dispatcher
 * Sends async non-blocking notifications to external endpoints (n8n, Zapier, Slack, etc.)
 * Core EventOS operates completely independently if n8n or external webhooks are unreachable.
 */

export interface WebhookPayload {
  event: "participant.created" | "participant.checked_in" | "certificate.generated" | "feedback.submitted";
  timestamp: string;
  data: Record<string, any>;
}

export async function dispatchWebhookEvent(
  event: WebhookPayload["event"],
  data: Record<string, any>
): Promise<void> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    // Webhook not configured — skip silently without blocking
    return;
  }

  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second hard timeout

    fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "EventOS-Webhook-Engine/1.0",
        "X-EventOS-Event": event,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
      .then((res) => {
        clearTimeout(timeoutId);
        if (!res.ok) {
          console.warn(`Webhook ${event} returned non-200 status: ${res.status}`);
        }
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        // Non-blocking log
        console.warn(`Webhook dispatch to ${webhookUrl} failed gracefully:`, err.message);
      });
  } catch (err) {
    // Non-blocking catch
    console.warn("Webhook dispatch caught error:", err);
  }
}
