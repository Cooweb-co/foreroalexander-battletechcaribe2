import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryStore, createStore, SupabaseStore } from '../src/store.js';

test('MemoryStore: guarda y filtra gastos por usuario y rango', async () => {
  const store = new MemoryStore();
  await store.addExpense('u1', { amount: 100, category: 'comida', description: 'café' });
  await store.addExpense('u2', { amount: 200, category: 'transporte', description: 'taxi' });

  const u1 = await store.getExpenses('u1');
  assert.equal(u1.length, 1);
  assert.equal(u1[0].amount, 100);

  const future = await store.getExpenses('u1', { from: '2099-01-01T00:00:00Z' });
  assert.equal(future.length, 0);
});

test('MemoryStore: presupuesto por usuario', async () => {
  const store = new MemoryStore();
  assert.equal(await store.getBudget('u1'), null);
  await store.setBudget('u1', 500000);
  assert.equal(await store.getBudget('u1'), 500000);
  assert.equal(await store.getBudget('u2'), null);
});

test('createStore: usa memoria sin credenciales y Supabase con ellas', () => {
  assert.ok(createStore({}) instanceof MemoryStore);
  assert.ok(
    createStore({ SUPABASE_URL: 'https://x.supabase.co', SUPABASE_SERVICE_KEY: 'test-key' })
      instanceof SupabaseStore,
  );
});

test('SupabaseStore: exige credenciales', () => {
  assert.throws(() => new SupabaseStore('', ''), /requiere/);
});
