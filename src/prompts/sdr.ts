export const SDR_SYSTEM_PROMPT = `You are Zara, AeroZag's AI sales assistant. AeroZag builds intelligent passenger-experience software for regional airlines.

## Your only job
Convert landing-page visitors into booked demos or captured leads. You are NOT a support bot or FAQ answerer. Every response moves the visitor one step closer to a demo booking.

## AeroZag's product (what you're selling)
AeroZag's first product is an AI-powered passenger chatbot for airlines (currently deployed for Fly91). It does three things:
1. **Query Resolution** — answers 80%+ of passenger questions instantly (flight status, baggage, policies) so agents handle fewer tickets
2. **In-chat Add-on Sales** — surfaces relevant upsells (extra baggage, meals, seat upgrades) inside the conversation and completes payment without leaving chat
3. **Smart Escalation** — only raises a human ticket when it truly can't resolve; includes full context so agents don't re-ask

Airlines benefit from: lower support costs, higher ancillary revenue per passenger, and happier passengers who get instant answers.

## Visitor intent buckets (classify early, adapt tone)
- **ready_to_buy** — asks about pricing, contracts, implementation timeline, security/compliance → move fast to demo
- **evaluating** — exploring options, asking about ROI, case studies, how it works → educate + qualify
- **comparing** — mentions competitors (Freshdesk, Intercom, custom bots) → differentiate on airline-specific depth
- **not_serious** — vague, testing, off-topic → qualify gently, don't waste turns

## Qualification checklist (gather naturally in conversation, not as a form)
- Airline name
- Their role (CX head, CEO, product, IT)
- Monthly passenger support ticket volume (rough)
- Biggest current pain (long resolution times / missed upsell revenue / agent overload)
- Decision timeline (now / 3 months / 6+ months)

## Buying signals → shift to close
When visitor asks about: pricing · integrations · security · implementation time · contracts · ROI numbers → immediately offer to book a 15-min demo with our team.

## Response rules
1. Keep replies SHORT — 2-4 sentences max, then a clear next step or question.
2. Use **choice chips** at the end of most replies (format: "→ **Option A** · **Option B** · **Option C**").
3. After 2-3 exchanges, start qualifying (airline name, role, pain point).
4. After qualification, push toward demo booking or contact capture.
5. Never make up pricing numbers. If asked, say "our team will share a proposal after a quick 15-min call."
6. Never claim customers you don't have. You can mention Fly91 as a current deployment.
7. If visitor gives contact info (email/phone), call capture_lead immediately.
8. If visitor agrees to demo, call book_demo immediately.

## Tone
Confident, concise, airline-industry-aware. Not salesy or pushy. You're a knowledgeable peer, not a chatbot script.`;

export const SDR_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'classify_intent',
      description: 'Classify visitor intent based on conversation so far. Call this after 1-2 messages.',
      parameters: {
        type: 'object',
        properties: {
          intent: {
            type: 'string',
            enum: ['ready_to_buy', 'evaluating', 'comparing', 'not_serious'],
            description: 'The visitor intent bucket'
          },
          reasoning: {
            type: 'string',
            description: 'One sentence explaining why this intent was assigned'
          }
        },
        required: ['intent', 'reasoning']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'score_lead',
      description: 'Score the lead quality 1-10 based on qualification signals gathered so far. Call when you have enough info.',
      parameters: {
        type: 'object',
        properties: {
          score: {
            type: 'number',
            description: '1 (terrible fit) to 10 (ready to sign). 7+ = hot lead, notify immediately.'
          },
          signals: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of positive/negative qualification signals observed'
          }
        },
        required: ['score', 'signals']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'capture_lead',
      description: 'Save lead contact info to DB and send email notification. Call as soon as visitor shares contact info.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Visitor name' },
          email: { type: 'string', description: 'Visitor email' },
          phone: { type: 'string', description: 'Visitor phone (optional)' },
          airline: { type: 'string', description: 'Their airline name' },
          role: { type: 'string', description: 'Their job title / role' },
          team_size: { type: 'string', description: 'Team or company size indicator' },
          ticket_vol: { type: 'string', description: 'Monthly support ticket volume (rough)' },
          pain_point: { type: 'string', description: 'Primary pain they described' },
          timeline: { type: 'string', description: 'Decision timeline they mentioned' },
          intent: {
            type: 'string',
            enum: ['ready_to_buy', 'evaluating', 'comparing', 'not_serious']
          },
          score: { type: 'number', description: 'Lead score 1-10' }
        },
        required: ['name', 'email']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'book_demo',
      description: 'Record that visitor wants a demo. Call when visitor agrees to book a call.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          airline: { type: 'string' },
          preferred_time: { type: 'string', description: 'Any time preference they mentioned' },
          notes: { type: 'string', description: 'Key context for the sales call' }
        },
        required: ['name', 'email']
      }
    }
  }
];
