// api/send-feedback.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const { message, email } = req.body || {};

  if (!message || message.trim().length < 3) {
    return res.status(400).json({ ok: false, error: 'Message is too short.' });
  }

  try {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const toEmail = process.env.TO_EMAIL || user;

    if (!host || !user || !pass || !toEmail) {
      console.error('Missing SMTP env vars');
      return res.status(500).json({ ok: false, error: 'Server misconfigured.' });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    await transporter.sendMail({
      from: user,
      to: toEmail,
      subject: 'New Feedback - HandyBox',
      replyTo: email || undefined,
      text: `
New Feedback:

Message:
${message}

From: ${email || 'No email provided'}
      `.trim()
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ ok: false, error: 'Failed to send email.' });
  }
}
