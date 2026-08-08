/**
 * GET /api/dashboard — función serverless de Vercel.
 */
import { createStore } from '../src/store.js';
import { FinBot } from '../src/finbot.js';

const USER_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const finbot = new FinBot(createStore());

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'método no permitido' });
  }
  try {
    const userId = String(req.query.userId ?? '');
    if (!USER_ID_RE.test(userId)) {
      return res.status(400).json({ error: 'userId (alfanumérico) es obligatorio' });
    }
    return res.status(200).json(await finbot.dashboard(userId));
  } catch (err) {
    console.error('Error en /api/dashboard:', err.message);
    return res.status(500).json({ error: 'No pude cargar el dashboard.' });
  }
}
