import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export interface LeadEmailPayload {
  name: string;
  email: string;
  phone?: string;
  airline?: string;
  role?: string;
  ticket_vol?: string;
  pain_point?: string;
  timeline?: string;
  intent?: string;
  score?: number;
  is_demo?: boolean;
}

export async function sendLeadNotification(lead: LeadEmailPayload): Promise<boolean> {
  const to = process.env.LEAD_NOTIFY_EMAIL || 'facebook.asim159@gmail.com';
  const tag = lead.is_demo ? '🗓️ DEMO REQUEST' : '🔥 NEW LEAD';
  const scoreBar = lead.score ? `${'█'.repeat(lead.score)}${'░'.repeat(10 - lead.score)} ${lead.score}/10` : 'unscored';

  const html = `
<div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#f6f7f7;padding:24px;border-radius:8px">
  <div style="background:#3a525f;color:#fff;padding:16px 24px;border-radius:6px 6px 0 0">
    <h2 style="margin:0;font-size:18px">${tag} — AeroZag Chatbot</h2>
  </div>
  <div style="background:#fff;padding:24px;border-radius:0 0 6px 6px;border:1px solid #eceef0">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#72797c;width:140px">Name</td><td style="padding:6px 0;font-weight:600">${lead.name}</td></tr>
      <tr><td style="padding:6px 0;color:#72797c">Email</td><td style="padding:6px 0"><a href="mailto:${lead.email}" style="color:#c05430">${lead.email}</a></td></tr>
      ${lead.phone ? `<tr><td style="padding:6px 0;color:#72797c">Phone</td><td style="padding:6px 0">${lead.phone}</td></tr>` : ''}
      ${lead.airline ? `<tr><td style="padding:6px 0;color:#72797c">Airline</td><td style="padding:6px 0">${lead.airline}</td></tr>` : ''}
      ${lead.role ? `<tr><td style="padding:6px 0;color:#72797c">Role</td><td style="padding:6px 0">${lead.role}</td></tr>` : ''}
      ${lead.ticket_vol ? `<tr><td style="padding:6px 0;color:#72797c">Ticket Volume</td><td style="padding:6px 0">${lead.ticket_vol}</td></tr>` : ''}
      ${lead.pain_point ? `<tr><td style="padding:6px 0;color:#72797c">Pain Point</td><td style="padding:6px 0">${lead.pain_point}</td></tr>` : ''}
      ${lead.timeline ? `<tr><td style="padding:6px 0;color:#72797c">Timeline</td><td style="padding:6px 0">${lead.timeline}</td></tr>` : ''}
      ${lead.intent ? `<tr><td style="padding:6px 0;color:#72797c">Intent</td><td style="padding:6px 0">${lead.intent.replace(/_/g, ' ')}</td></tr>` : ''}
      ${lead.score ? `<tr><td style="padding:6px 0;color:#72797c">Lead Score</td><td style="padding:6px 0;font-family:monospace">${scoreBar}</td></tr>` : ''}
    </table>
    <div style="margin-top:20px;padding:12px;background:#f6f7f7;border-radius:4px;font-size:13px;color:#72797c">
      Captured by AeroZag SDR chatbot · ${new Date().toISOString()}
    </div>
  </div>
</div>`;

  try {
    await transporter.sendMail({
      from: `"AeroZag Leads" <${process.env.GMAIL_USER}>`,
      to,
      subject: `${tag}: ${lead.name} — ${lead.airline || lead.email}`,
      html
    });
    return true;
  } catch (err) {
    console.error('[email] Failed to send lead notification:', err);
    return false;
  }
}
