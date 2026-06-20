import { v4 as uuid } from 'uuid';
import db from '../db/schema';
import { sendLeadNotification, LeadEmailPayload } from './email';

export interface LeadInput {
  name: string;
  email: string;
  phone?: string;
  airline?: string;
  role?: string;
  team_size?: string;
  ticket_vol?: string;
  pain_point?: string;
  timeline?: string;
  intent?: string;
  score?: number;
  source?: string;
  conv_id?: string;
  is_demo?: boolean;
}

export async function saveLead(input: LeadInput): Promise<string> {
  const id = uuid();

  db.prepare(`
    INSERT OR IGNORE INTO leads
      (id, name, email, phone, airline, role, team_size, ticket_vol, pain_point, timeline, intent, score, source, conv_id)
    VALUES
      (@id, @name, @email, @phone, @airline, @role, @team_size, @ticket_vol, @pain_point, @timeline, @intent, @score, @source, @conv_id)
  `).run({
    id,
    name: input.name,
    email: input.email,
    phone: input.phone ?? null,
    airline: input.airline ?? null,
    role: input.role ?? null,
    team_size: input.team_size ?? null,
    ticket_vol: input.ticket_vol ?? null,
    pain_point: input.pain_point ?? null,
    timeline: input.timeline ?? null,
    intent: input.intent ?? null,
    score: input.score ?? null,
    source: input.source ?? 'chatbot',
    conv_id: input.conv_id ?? null
  });

  // Send email notification (fire-and-forget — DB already persisted)
  const emailPayload: LeadEmailPayload = { ...input };
  sendLeadNotification(emailPayload).then(sent => {
    if (sent) {
      db.prepare('UPDATE leads SET email_sent = 1 WHERE id = ?').run(id);
    }
  });

  return id;
}

export function getLeads(limit = 100, offset = 0) {
  return db.prepare(`
    SELECT * FROM leads ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(limit, offset);
}
