import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStore } from '../src/store.js';
import { FinBot } from '../src/finbot.js';

test('borrar el último: elimina solo el gasto más reciente', async () => {
  const bot = new FinBot(new MemoryStore());
  await bot.handleMessage('u1', 'gasté 10.000 en café');
  await bot.handleMessage('u1', '50k mercado');

  const reply = await bot.handleMessage('u1', 'borra el último');
  assert.match(reply, /🗑️/);
  assert.match(reply, /\$50\.000/);

  const summary = await bot.handleMessage('u1', '/resumen');
  assert.match(summary, /\$10\.000/);
  assert.doesNotMatch(summary, /mercado/);
});

test('borrar en lenguaje natural y comando /borrar', async () => {
  const bot = new FinBot(new MemoryStore());
  await bot.handleMessage('u1', '10k café');
  assert.match(await bot.handleMessage('u1', '/borrar'), /🗑️/);
  assert.match(await bot.handleMessage('u1', 'borrar el ultimo'), /nada que borrar/);
});

test('borrar sin gastos avisa sin romper', async () => {
  const bot = new FinBot(new MemoryStore());
  const reply = await bot.handleMessage('u1', 'borra el último');
  assert.match(reply, /nada que borrar/);
});

test('MemoryStore.deleteExpense respeta la propiedad del gasto', async () => {
  const store = new MemoryStore();
  const e = await store.addExpense('u1', { amount: 100, category: 'otros', description: 'x' });
  assert.equal(await store.deleteExpense('intruso', e.id), false);
  assert.equal(await store.deleteExpense('u1', e.id), true);
});
