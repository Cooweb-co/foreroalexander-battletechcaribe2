import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCsv } from '../src/summary.js';
import { MemoryStore } from '../src/store.js';
import { FinBot } from '../src/finbot.js';

test('toCsv: cabecera, filas y escape RFC 4180', () => {
  const csv = toCsv([
    { created_at: '2026-08-08T12:00:00Z', amount: 15000, category: 'comida', description: 'café "doble", grande' },
  ]);
  const lines = csv.split('\r\n');
  assert.equal(lines[0], '"fecha","monto","categoria","descripcion"');
  assert.equal(lines[1], '"2026-08-08T12:00:00Z","15000","comida","café ""doble"", grande"');
  assert.equal(lines.at(-1), ''); // termina en CRLF
});

test('toCsv: sin gastos solo devuelve cabecera', () => {
  assert.equal(toCsv([]), '"fecha","monto","categoria","descripcion"\r\n');
});

test('exportCsv: exporta los gastos del mes del usuario', async () => {
  const bot = new FinBot(new MemoryStore());
  await bot.handleMessage('u1', 'gasté 15.000 en café');
  await bot.handleMessage('otro', '99k cine');

  const csv = await bot.exportCsv('u1');
  assert.match(csv, /comida/);
  assert.match(csv, /"15000"/);
  assert.doesNotMatch(csv, /99000/); // no mezcla usuarios
});
