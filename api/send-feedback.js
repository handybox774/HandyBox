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
  // Allow OPTIONS (preflight) safely
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "POST, OPTIONS");
    return res.status(204).end();
  }

  // POST only
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
    const name = (body.name ?? "").toString().trim();
    const tool = (body.tool ?? "").toString().trim();
    const page = (body.page ?? "").toString().trim();
    const website = (body.website ?? "").toString().trim(); // honeypot

    // Honeypot: ignore bots silently
    if (website) return res.status(200).json({ ok: true });

    if (!message || message.length < 3) {
      return res.status(400).json({ ok: false, error: "Message is too short." });
    }
    if (message.length > 4000) {
      return res.status(400).json({ ok: false, error: "Message is too long." });
    }

    const SMTP_HOST = env("SMTP_HOST");
    const SMTP_PORT = toPort(env("SMTP_PORT"));
    const SMTP_USER = env("SMTP_USER");
    const SMTP_PASS = env("SMTP_PASS");
    const TO_EMAIL = env("TO_EMAIL") || SMTP_USER;

    const missing = [];
    if (!SMTP_HOST) missing.push("SMTP_HOST");
    if (!SMTP_USER) missing.push("SMTP_USER");
    if (!SMTP_PASS) missing.push("SMTP_PASS");
    if (!TO_EMAIL) missing.push("TO_EMAIL");

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

      // These prevent “stuck sending forever”
      connectionTimeout: 10_000, // 10s
      greetingTimeout: 10_000,
      socketTimeout: 15_000,     // 15s
    });

    // Verify quickly (helps you get a clear error instead of hanging)
    await transporter.verify();

    const subject = tool ? `Handy Box Feedback (${tool})` : "Handy Box Feedback";

    await transporter.sendMail({
      // Important: From should be your authenticated SMTP user to avoid rejections
      from: `Handy Box <${SMTP_USER}>`,
      to: TO_EMAIL,
      replyTo: email || undefined,
      subject,
      text: [
        "New feedback received:",
        "",
        `Message:\n${message}`,
        "",
        `From Email: ${email || "Not provided"}`,
        `Name: ${name || "Anonymous"}`,
        `Tool: ${tool || "Not provided"}`,
        `Page: ${page || "Not provided"}`,
      ].join("\n"),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("send-feedback error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to send email.",
      detail: err?.message ? String(err.message).slice(0, 180) : "Unknown error",
    });
  }
}
