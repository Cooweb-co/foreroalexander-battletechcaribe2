import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStore } from '../src/store.js';
import { FinBot } from '../src/finbot.js';

const USER = 'test-user';
const newBot = () => new FinBot(new MemoryStore());

test('flujo completo: registrar gasto → ver resumen', async () => {
  const bot = newBot();

  const r1 = await bot.handleMessage(USER, 'gasté 15.000 en café');
  assert.match(r1, /Registrado/);
  assert.match(r1, /\$15\.000/);
  assert.match(r1, /comida/);

  const r2 = await bot.handleMessage(USER, '/resumen');
  assert.match(r2, /Resumen/);
  assert.match(r2, /\$15\.000/);
});

test('presupuesto: definir y recibir alerta al superarlo', async () => {
  const bot = newBot();

  const r1 = await bot.handleMessage(USER, '/presupuesto 50000');
  assert.match(r1, /\$50\.000/);

  await bot.handleMessage(USER, 'gasté 30.000 en mercado');
  const r2 = await bot.handleMessage(USER, 'gasté 30.000 en cine');
  assert.match(r2, /🚨/); // 60.000 > 50.000 → alerta de presupuesto superado
});

test('entrada ambigua pide aclaración sin romper', async () => {
  const bot = newBot();
  const reply = await bot.handleMessage(USER, 'gasté mucho hoy');
  assert.match(reply, /No logré identificar un monto/);
});

test('mensaje vacío y /start responden con ayuda', async () => {
  const bot = newBot();
  assert.match(await bot.handleMessage(USER, '/start'), /FinBot/);
  assert.match(await bot.handleMessage(USER, '   '), /monto/);
});

test('los gastos de un usuario no se mezclan con otro', async () => {
  const bot = newBot();
  await bot.handleMessage('user-a', '10000 café');
  const summaryB = await bot.handleMessage('user-b', '/resumen');
  assert.match(summaryB, /Aún no tienes gastos/);
});
