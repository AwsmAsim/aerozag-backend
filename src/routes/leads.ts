import { Router, Request, Response } from 'express';
import { saveLead, getLeads } from '../services/leads';

const router = Router();

// Manual lead capture (from the "Talk to Us" form on landing page)
router.post('/', async (req: Request, res: Response) => {
  const { name, email, phone, airline, role, pain_point, message } = req.body;

  // Honeypot spam check
  if (req.body.website) {
    return res.json({ ok: true }); // silently drop bots
  }

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email required' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'invalid email' });
  }

  try {
    const lead_id = await saveLead({
      name,
      email,
      phone,
      airline,
      role,
      pain_point: pain_point || message,
      source: 'contact_form'
    });
    return res.json({ ok: true, lead_id });
  } catch (err) {
    console.error('[leads] Error:', err);
    return res.status(500).json({ error: 'Could not save lead' });
  }
});

// Admin: list leads (token-gated)
router.get('/', (req: Request, res: Response) => {
  const token = req.headers['x-admin-token'];
  if (!token || token !== process.env.ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
  const offset = parseInt(req.query.offset as string) || 0;

  const leads = getLeads(limit, offset);
  return res.json({ leads, count: leads.length });
});

export default router;
