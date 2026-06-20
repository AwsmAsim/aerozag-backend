import { Router, Request, Response } from 'express';
import { processChat } from '../services/chat';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  const { session_id, message, history = [] } = req.body;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ error: 'session_id required' });
  }
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    return res.status(400).json({ error: 'message required' });
  }
  if (message.length > 2000) {
    return res.status(400).json({ error: 'message too long' });
  }

  try {
    const result = await processChat({ session_id, message: message.trim(), history });
    return res.json(result);
  } catch (err) {
    console.error('[chat] Error:', err);
    return res.status(500).json({ error: 'Chat service error' });
  }
});

export default router;
