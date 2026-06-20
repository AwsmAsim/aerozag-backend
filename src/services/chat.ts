import OpenAI from 'openai';
import { v4 as uuid } from 'uuid';
import db from '../db/schema';
import { SDR_SYSTEM_PROMPT, SDR_TOOLS } from '../prompts/sdr';
import { saveLead } from './leads';

const client = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://aerozag.ai',
    'X-Title': 'AeroZag SDR Bot'
  }
});

const MODEL = 'z-ai/glm-5.2';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  session_id: string;
  message: string;
  history: ChatMessage[];
}

export interface ChatResponse {
  reply: string;
  chips: string[];
  conv_id: string;
  lead_captured: boolean;
  demo_booked: boolean;
}

// Split a "CHIPS: a | b | c" trailing line out of the model reply.
function extractChips(text: string): { reply: string; chips: string[] } {
  const lines = text.split('\n');
  for (let i = lines.length - 1; i >= 0; i--) {
    const m = lines[i].match(/^\s*CHIPS:\s*(.+)$/i);
    if (m) {
      const chips = m[1]
        .split('|')
        .map(s => s.trim().replace(/^[→·*\-\s]+/, '').replace(/\*+/g, ''))
        .filter(Boolean)
        .slice(0, 4);
      lines.splice(i, 1);
      return { reply: lines.join('\n').trim(), chips };
    }
  }
  return { reply: text.trim(), chips: [] };
}

function getOrCreateConv(session_id: string): string {
  const existing = db.prepare(
    'SELECT id FROM conversations WHERE session_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(session_id) as { id: string } | undefined;

  if (existing) return existing.id;

  const id = uuid();
  db.prepare(
    'INSERT INTO conversations (id, session_id) VALUES (?, ?)'
  ).run(id, session_id);
  return id;
}

function saveMessage(conv_id: string, role: string, content: string, tool_name?: string) {
  db.prepare(
    'INSERT INTO messages (id, conv_id, role, content, tool_name) VALUES (?, ?, ?, ?, ?)'
  ).run(uuid(), conv_id, role, content, tool_name ?? null);
}

export async function processChat(req: ChatRequest): Promise<ChatResponse> {
  const conv_id = getOrCreateConv(req.session_id);
  let lead_captured = false;
  let demo_booked = false;

  saveMessage(conv_id, 'user', req.message);

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: SDR_SYSTEM_PROMPT },
    ...req.history.map(m => ({ role: m.role, content: m.content } as OpenAI.ChatCompletionMessageParam)),
    { role: 'user', content: req.message }
  ];

  // Agentic loop — handle tool calls until model returns a plain text reply
  let finalReply = '';
  let iterations = 0;
  const MAX_ITER = 5;

  while (iterations < MAX_ITER) {
    iterations++;

    const response = await client.chat.completions.create({
      model: MODEL,
      messages,
      tools: SDR_TOOLS,
      tool_choice: 'auto',
      max_tokens: 512,
      temperature: 0.4
    });

    const choice = response.choices[0];

    if (choice.finish_reason === 'tool_calls' && choice.message.tool_calls) {
      messages.push(choice.message);

      for (const tc of choice.message.tool_calls) {
        const args = JSON.parse(tc.function.arguments || '{}');
        let result = 'ok';

        if (tc.function.name === 'capture_lead') {
          const lead_id = await saveLead({ ...args, conv_id, is_demo: false });
          db.prepare('UPDATE conversations SET lead_id = ? WHERE id = ?').run(lead_id, conv_id);
          lead_captured = true;
          result = JSON.stringify({ success: true, lead_id });
          saveMessage(conv_id, 'tool', result, 'capture_lead');
        } else if (tc.function.name === 'book_demo') {
          const lead_id = await saveLead({ ...args, conv_id, source: 'demo_request', is_demo: true });
          db.prepare('UPDATE conversations SET lead_id = ? WHERE id = ?').run(lead_id, conv_id);
          demo_booked = true;
          result = JSON.stringify({ success: true, lead_id });
          saveMessage(conv_id, 'tool', result, 'book_demo');
        } else if (tc.function.name === 'classify_intent') {
          db.prepare("UPDATE conversations SET intent = ?, updated_at = datetime('now') WHERE id = ?")
            .run(args.intent, conv_id);
          result = JSON.stringify({ success: true });
        } else if (tc.function.name === 'score_lead') {
          db.prepare("UPDATE conversations SET score = ?, updated_at = datetime('now') WHERE id = ?")
            .run(args.score, conv_id);
          result = JSON.stringify({ success: true });
        }

        messages.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: result
        });
      }

      continue; // feed tool results back to model
    }

    // Plain text reply
    finalReply = choice.message.content || '';
    break;
  }

  if (!finalReply) finalReply = "I'm having trouble right now. Please email us at hello@aerozag.ai.";

  const { reply, chips } = extractChips(finalReply);

  // Persist the full reply (with chips line) for the transcript record.
  saveMessage(conv_id, 'assistant', finalReply);

  return { reply, chips, conv_id, lead_captured, demo_booked };
}
