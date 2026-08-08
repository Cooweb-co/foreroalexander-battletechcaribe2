import { test } from 'node:test';
import assert from 'node:assert/strict';
import { monthRange, evaluateBudget, budgetAlert } from '../src/budget.js';
import { formatMoney } from '../src/summary.js';

test('monthRange: cubre exactamente el mes calendario', () => {
  const { from, to } = monthRange(new Date('2026-08-08T12:00:00Z'));
  assert.equal(from, '2026-08-01T00:00:00.000Z');
  assert.equal(to, '2026-09-01T00:00:00.000Z');
});

test('evaluateBudget: niveles ok / warning / exceeded', () => {
  assert.equal(evaluateBudget(100_000, 500_000).level, 'ok');
  assert.equal(evaluateBudget(400_000, 500_000).level, 'warning'); // 80%
  assert.equal(evaluateBudget(500_000, 500_000).level, 'exceeded'); // 100%
  assert.equal(evaluateBudget(600_000, 500_000).level, 'exceeded');
});

test('evaluateBudget: sin presupuesto definido', () => {
  assert.equal(evaluateBudget(100_000, null).level, 'none');
  assert.equal(evaluateBudget(100_000, 0).level, 'none');
});

test('budgetAlert: solo alerta en warning y exceeded', () => {
  assert.equal(budgetAlert(evaluateBudget(100_000, 500_000), formatMoney), null);
  assert.match(budgetAlert(evaluateBudget(450_000, 500_000), formatMoney), /⚠️/);
  assert.match(budgetAlert(evaluateBudget(600_000, 500_000), formatMoney), /🚨/);
});
