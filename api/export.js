/**
 * GET /api/export — descarga los gastos del mes en CSV.
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
    const csv = await finbot.exportCsv(userId);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="finbot-gastos.csv"');
    return res.status(200).send(csv);
  } catch (err) {
    console.error('Error en /api/export:', err.message);
    return res.status(500).json({ error: 'No pude generar el CSV.' });
  }
}
