/**
 * POST /api/chat — función serverless de Vercel.
 * Mismo núcleo conversacional que Telegram y el servidor local.
 */
import { createStore } from '../src/store.js';
import { FinBot } from '../src/finbot.js';

const USER_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const finbot = new FinBot(createStore());

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'método no permitido' });
  }
  try {
    const { userId, text } = req.body ?? {};
    if (typeof text !== 'string' || typeof userId !== 'string' || !USER_ID_RE.test(userId)) {
      return res.status(400).json({ error: 'userId (alfanumérico) y text son obligatorios' });
    }
    const reply = await finbot.handleMessage(userId, text.slice(0, 500));
    return res.status(200).json({ reply });
  } catch (err) {
    console.error('Error en /api/chat:', err.message);
    return res.status(500).json({ error: 'No pude procesar tu mensaje, inténtalo de nuevo.' });
  }
}
