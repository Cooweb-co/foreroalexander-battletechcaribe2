import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAmount, detectCategory, parseExpense } from '../src/parser.js';

test('parseAmount: formatos colombianos y europeos', () => {
  assert.equal(parseAmount('15.000'), 15000);
  assert.equal(parseAmount('1.234.567'), 1234567);
  assert.equal(parseAmount('12,50'), 12.5);
  assert.equal(parseAmount('1.234,56'), 1234.56);
  assert.equal(parseAmount('1,234.56'), 1234.56);
  assert.equal(parseAmount('$ 25000'), 25000);
  assert.equal(parseAmount('15k'), 15000);
});

test('parseAmount: entradas inválidas devuelven null', () => {
  assert.equal(parseAmount(''), null);
  assert.equal(parseAmount('abc'), null);
  assert.equal(parseAmount('0'), null);
  assert.equal(parseAmount('-500'), null);
  assert.equal(parseAmount(null), null);
});

test('detectCategory: palabras clave en español', () => {
  assert.equal(detectCategory('gasté 15000 en café'), 'comida');
  assert.equal(detectCategory('pagué el taxi al trabajo'), 'transporte');
  assert.equal(detectCategory('recibo de la luz'), 'servicios');
  assert.equal(detectCategory('entradas de cine'), 'entretenimiento');
  assert.equal(detectCategory('compré en el D1'), 'mercado');
  assert.equal(detectCategory('algo sin categoría clara'), 'otros');
});

test('parseExpense: mensajes naturales completos', () => {
  const e1 = parseExpense('gasté 15.000 en café');
  assert.equal(e1.amount, 15000);
  assert.equal(e1.category, 'comida');

  const e2 = parseExpense('25000 almuerzo');
  assert.equal(e2.amount, 25000);
  assert.equal(e2.category, 'comida');

  const e3 = parseExpense('pagué $40.000 de taxi al aeropuerto');
  assert.equal(e3.amount, 40000);
  assert.equal(e3.category, 'transporte');
  assert.match(e3.description, /taxi/);

  const e4 = parseExpense('15k mercado');
  assert.equal(e4.amount, 15000);
  assert.equal(e4.category, 'mercado');
});

test('parseExpense: mensajes ambiguos devuelven null (sin monto)', () => {
  assert.equal(parseExpense('gasté mucho hoy'), null);
  assert.equal(parseExpense(''), null);
  assert.equal(parseExpense(null), null);
});
