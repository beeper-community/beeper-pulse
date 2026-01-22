/**
 * Email notifications via Resend or SendGrid
 */

import type { NotificationPayload, NotificationResult, NotificationConfig } from "./types.js";

const SUBJECTS = {
  release: "🚀 New Beeper Release",
  digest: "📰 Weekly Beeper Community Digest",
  status: "⚠️ Beeper Status Update",
  alert: "🚨 Beeper Alert",
};

interface EmailBody {
  from: string;
  to: string[];
  subject: string;
  html: string;
  text: string;
}

function generateHtml(payload: NotificationPayload): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #5865f2; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #5865f2; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
    .footer { margin-top: 20px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0;">${payload.title}</h1>
    </div>
    <div class="content">
      <p>${payload.message.replace(/\n/g, "<br>")}</p>
      ${payload.url ? `<a href="${payload.url}" class="button">View Details</a>` : ""}
    </div>
    <div class="footer">
      <p>Sent by <a href="https://github.com/beeper-community/beeper-pulse">beeper-pulse</a></p>
      <p>You're receiving this because you subscribed to Beeper ecosystem updates.</p>
    </div>
  </div>
</body>
</html>`;
}

async function sendViaResend(
  emailBody: EmailBody,
  apiKey: string
): Promise<Response> {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(emailBody),
  });
}

async function sendViaSendGrid(
  emailBody: EmailBody,
  apiKey: string
): Promise<Response> {
  return fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      personalizations: [{ to: emailBody.to.map((email) => ({ email })) }],
      from: { email: emailBody.from },
      subject: emailBody.subject,
      content: [
        { type: "text/plain", value: emailBody.text },
        { type: "text/html", value: emailBody.html },
      ],
    }),
  });
}

export async function sendEmailNotification(
  payload: NotificationPayload,
  config: NotificationConfig["email"]
): Promise<NotificationResult> {
  if (!config?.apiKey || !config.from || !config.to?.length) {
    return {
      success: false,
      provider: "email",
      error: "Email configuration incomplete",
      timestamp: new Date(),
    };
  }

  const emailBody: EmailBody = {
    from: config.from,
    to: config.to,
    subject: SUBJECTS[payload.type],
    html: generateHtml(payload),
    text: `${payload.title}\n\n${payload.message}\n\n${payload.url || ""}`,
  };

  try {
    const response =
      config.provider === "resend"
        ? await sendViaResend(emailBody, config.apiKey)
        : await sendViaSendGrid(emailBody, config.apiKey);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`${config.provider} returned ${response.status}: ${errorText}`);
    }

    return {
      success: true,
      provider: `email:${config.provider}`,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      provider: `email:${config.provider}`,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date(),
    };
  }
}
