import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupByCategory, monthlySummary, progressBar, formatMoney } from '../src/summary.js';

const expenses = [
  { amount: 15000, category: 'comida' },
  { amount: 25000, category: 'comida' },
  { amount: 50000, category: 'transporte' },
];

test('groupByCategory: agrupa y ordena de mayor a menor', () => {
  const groups = groupByCategory(expenses);
  assert.deepEqual(groups, [
    ['transporte', 50000],
    ['comida', 40000],
  ]);
});

test('monthlySummary: incluye total, categorías y consejo', () => {
  const text = monthlySummary(expenses, 500000, 'agosto 2026');
  assert.match(text, /agosto 2026/);
  assert.match(text, /\$90\.000/);
  assert.match(text, /comida/);
  assert.match(text, /transporte/);
  assert.match(text, /Presupuesto/);
  assert.match(text, /oportunidad de ahorro/);
});

test('monthlySummary: mes vacío invita a registrar', () => {
  const text = monthlySummary([], null, 'agosto 2026');
  assert.match(text, /Aún no tienes gastos/);
});

test('progressBar: proporciones y límites', () => {
  assert.equal(progressBar(0), '░░░░░░░░░░');
  assert.equal(progressBar(0.5), '▓▓▓▓▓░░░░░');
  assert.equal(progressBar(1), '▓▓▓▓▓▓▓▓▓▓');
  assert.equal(progressBar(2), '▓▓▓▓▓▓▓▓▓▓'); // nunca desborda
});

test('formatMoney: formato es-CO', () => {
  assert.equal(formatMoney(15000), '$15.000');
  assert.equal(formatMoney(1234567), '$1.234.567');
});
