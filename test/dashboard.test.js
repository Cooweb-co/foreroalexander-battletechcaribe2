import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStore } from '../src/store.js';
import { FinBot } from '../src/finbot.js';

test('dashboard: agrega totales, categorías y estado del presupuesto', async () => {
  const bot = new FinBot(new MemoryStore());
  await bot.handleMessage('u1', '/presupuesto 100000');
  await bot.handleMessage('u1', 'gasté 30.000 en mercado');
  await bot.handleMessage('u1', '15k café');

  const d = await bot.dashboard('u1');
  assert.equal(d.total, 45000);
  assert.equal(d.budget, 100000);
  assert.equal(d.remaining, 55000);
  assert.equal(d.level, 'ok');
  assert.equal(d.byCategory.mercado, 30000);
  assert.equal(d.byCategory.comida, 15000);
  assert.equal(d.recent.length, 2);
  assert.match(d.tip, /mercado/);
});

test('dashboard: usuario nuevo recibe estado vacío con invitación', async () => {
  const bot = new FinBot(new MemoryStore());
  const d = await bot.dashboard('nuevo');
  assert.equal(d.total, 0);
  assert.equal(d.budget, null);
  assert.deepEqual(d.byCategory, {});
  assert.match(d.tip, /primer gasto/);
});

test('dashboard: refleja presupuesto superado', async () => {
  const bot = new FinBot(new MemoryStore());
  await bot.handleMessage('u1', '/presupuesto 20000');
  await bot.handleMessage('u1', 'gasté 30.000 en cine');
  const d = await bot.dashboard('u1');
  assert.equal(d.level, 'exceeded');
  assert.match(d.tip, /Presupuesto superado/);
});

test('dashboard: compara contra el mes anterior', async () => {
  const store = new MemoryStore();
  const bot = new FinBot(store);
  const prevMonth = new Date();
  prevMonth.setUTCMonth(prevMonth.getUTCMonth() - 1, 15);
  store.expenses.push({
    id: 999, user_id: 'u1', amount: 100000, category: 'otros',
    description: 'mes pasado', created_at: prevMonth.toISOString(),
  });
  await bot.handleMessage('u1', 'gasté 50.000 en mercado');
  const d = await bot.dashboard('u1');
  assert.equal(d.total, 50000);
  assert.equal(d.prevTotal, 100000);
});
