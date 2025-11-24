// api/feedback.js

import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    const { message, email } = req.body || {};

    if (!message || !message.trim()) {
      return res.status(400).json({ ok: false, error: 'Message is required.' });
    }

    // إيميل الفيدباك الخاص بالموقع (اللي حطيتيه في env)
    const user = process.env.FEEDBACK_EMAIL_USER;
    const pass = process.env.FEEDBACK_EMAIL_PASS;

    if (!user || !pass) {
      return res.status(500).json({ ok: false, error: 'Email env vars missing.' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
      auth: { user, pass },
    });

    const fromLabel = email && email.trim()
      ? `"Handy Box Feedback" <${user}>`
      : `"Handy Box Feedback" <${user}>`;

    const bodyText = [
      `New feedback from Handy Box:`,
      '',
      `From: ${email || '(no email provided)'}`,
      '',
      'Message:',
      message,
    ].join('\n');

    await transporter.sendMail({
      from: fromLabel,
      to: user,               // توصلك إنتِ
      subject: 'New feedback from Handy Box',
      text: bodyText,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Feedback error:', err);
    return res.status(500).json({ ok: false, error: 'Server error.' });
  }
}
