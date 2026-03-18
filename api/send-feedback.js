// api/send-feedback.js
import nodemailer from "nodemailer";

function env(name) {
  const v = process.env[name];
  return typeof v === "string" ? v.trim() : "";
}

function toPort(v) {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 587;
}

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("X-Content-Type-Options", "nosniff");

  try {
    const body = req.body || {};
    const message = (body.message ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim();
    const tool = (body.tool ?? "").toString().trim();
    const page = (body.page ?? "").toString().trim();
    const website = (body.website ?? "").toString().trim(); // honeypot

    if (website) return res.status(200).json({ ok: true });

    if (!message || message.length < 3) {
      return res.status(400).json({ ok: false, error: "Message is too short." });
    }
    if (message.length > 4000) {
      return res.status(400).json({ ok: false, error: "Message is too long." });
    }

    const SMTP_HOST = env("SMTP_HOST");           // smtp.sendgrid.net
    const SMTP_PORT = toPort(env("SMTP_PORT"));   // 587
    const SMTP_USER = env("SMTP_USER");           // apikey
    const SMTP_PASS = env("SMTP_PASS");           // SG.xxxxx
    const TO_EMAIL = env("TO_EMAIL");
    const FROM_EMAIL = env("FROM_EMAIL");         // must be verified in SendGrid

    const missing = [];
    if (!SMTP_HOST) missing.push("SMTP_HOST");
    if (!SMTP_USER) missing.push("SMTP_USER");
    if (!SMTP_PASS) missing.push("SMTP_PASS");
    if (!TO_EMAIL) missing.push("TO_EMAIL");
    if (!FROM_EMAIL) missing.push("FROM_EMAIL");

    if (missing.length) {
      console.error("Missing env vars:", missing);
      return res.status(500).json({
        ok: false,
        error: "Server misconfigured.",
        detail: `Missing: ${missing.join(", ")}`,
      });
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });

    await transporter.verify();

    const subject = tool ? `Handy Box Feedback (${tool})` : "Handy Box Feedback";

   await transporter.sendMail({
  from: `Handy Box <${FROM_EMAIL}>`,
  to: TO_EMAIL,
  replyTo: email || undefined,
  subject: "You have a new message from HandyBox.tools",

  text: `Hi,

You received a new message from your website.

Message:
${message}

From:
${email || "Not provided"}

Page:
${page || "Unknown"}

— HandyBox.tools`,

  html: `
    <div style="font-family: Arial; line-height:1.6;">
      <h2 style="color:#333;">New message from HandyBox.tools</h2>
      
      <p><strong>Message:</strong></p>
      <p>${message}</p>

      <hr>

      <p><strong>From:</strong> ${email || "Not provided"}</p>
      <p><strong>Page:</strong> ${page || "Unknown"}</p>

      <br>
      <p style="font-size:12px;color:#888;">
        This email was sent via HandyBox.tools
      </p>
    </div>
  `,
});

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("send-feedback error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to send email.",
      detail: err?.message ? String(err.message).slice(0, 250) : "Unknown error",
    });
  }
}
