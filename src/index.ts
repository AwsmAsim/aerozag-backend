import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

// Initialize DB (runs migrations on import)
import './db/schema';

import chatRouter from './routes/chat';
import leadsRouter from './routes/leads';

const app = express();
const PORT = parseInt(process.env.PORT || '3000');

// CORS
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:4280').split(',').map(s => s.trim());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Admin-Token']
}));

app.use(express.json({ limit: '16kb' }));

// Rate limiting on chat endpoint
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many messages, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false
});

// General limiter for all routes
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(generalLimiter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.use('/api/chat', chatLimiter, chatRouter);
app.use('/api/leads', leadsRouter);

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`[aerozag-backend] listening on port ${PORT}`);
});

export default app;
