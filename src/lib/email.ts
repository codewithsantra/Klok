/**
 * Minimal transactional email sender.
 *
 * In production, set RESEND_API_KEY (and optionally EMAIL_FROM) and emails are
 * sent via Resend's REST API — no SDK dependency required.
 *
 * In development (no key), emails are logged to the server console so the full
 * flow is testable without any provider credentials.
 */

type Mail = { to: string; subject: string; html: string };

export async function sendEmail(mail: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "Klok <onboarding@resend.dev>";

  if (!key) {
    const links = [...mail.html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
    console.log(
      `\n[email:dev] (no RESEND_API_KEY — not actually sent)\n  To: ${mail.to}\n  Subject: ${mail.subject}` +
        (links.length ? `\n  Links: ${links.join(" , ")}` : "") +
        "\n",
    );
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, to: mail.to, subject: mail.subject, html: mail.html }),
  });

  if (!res.ok) {
    throw new Error(`Email send failed: ${res.status} ${await res.text()}`);
  }
}

/** Branded HTML for the password-reset email. */
export function passwordResetEmail(resetUrl: string): { subject: string; html: string } {
  return {
    subject: "Reset your Klok password",
    html: `
      <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #15152B;">
        <div style="font-size: 20px; font-weight: 800; color: #6C6FDF; margin-bottom: 16px;">Klok</div>
        <h1 style="font-size: 20px; margin: 0 0 12px;">Reset your password</h1>
        <p style="color: #5B5B73; line-height: 1.6; margin: 0 0 24px;">
          We received a request to reset your Klok password. Click the button below to choose a new one.
          This link expires in 1 hour. If you didn't request this, you can safely ignore this email.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #6C6FDF; color: #fff; text-decoration: none; font-weight: 700; padding: 12px 22px; border-radius: 10px;">
          Reset password
        </a>
        <p style="color: #9494AE; font-size: 12px; line-height: 1.6; margin: 24px 0 0;">
          Or paste this link into your browser:<br/>
          <span style="color: #6C6FDF; word-break: break-all;">${resetUrl}</span>
        </p>
      </div>
    `,
  };
}
