/**
 * Núcleo conversacional de FinBot, independiente del canal (Telegram, CLI, tests).
 * Recibe un mensaje y devuelve la respuesta en Markdown.
 */
import { extractExpense } from './ai.js';
import { parseAmount } from './parser.js';
import { monthRange, evaluateBudget, budgetAlert } from './budget.js';
import { monthlySummary, formatMoney, toCsv } from './summary.js';

const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

export const WELCOME = [
  '👋 ¡Hola! Soy *FinBot*, tu asesor financiero personal.',
  '',
  'Cuéntame tus gastos como le hablarías a un amigo:',
  '• _"gasté 15.000 en café"_ ☕',
  '• _"25k almuerzo"_ 🍽️',
  '• _"pagué $40.000 de taxi"_ 🚕',
  '',
  'Comandos:',
  '📊 /resumen — tus gastos del mes',
  '🎯 /presupuesto 500000 — define tu tope mensual',
  '❓ /ayuda — ver esta guía de nuevo',
].join('\n');

const CLARIFY = [
  '🤔 No logré identificar un monto en tu mensaje.',
  '',
  'Inténtalo así: _"gasté 15.000 en café"_ o _"25000 almuerzo"_.',
  'También puedes pedir tu /resumen del mes. 😉',
].join('\n');

export class FinBot {
  constructor(store) {
    this.store = store;
  }

  /** Punto de entrada único: texto del usuario → respuesta Markdown. */
  async handleMessage(userId, rawText) {
    const text = String(rawText ?? '').trim();
    if (!text) return CLARIFY;

    if (/^\/(start|ayuda|help)/.test(text)) return WELCOME;
    if (/^\/resumen/.test(text) || /^resumen$/i.test(text)) return this.summary(userId);
    if (/^\/presupuesto/.test(text) || /^presupuesto\b/i.test(text)) return this.setBudget(userId, text);

    return this.registerExpense(userId, text);
  }

  async registerExpense(userId, text) {
    const expense = await extractExpense(text);
    if (!expense) return CLARIFY;

    await this.store.addExpense(userId, expense);

    const { from, to } = monthRange();
    const monthExpenses = await this.store.getExpenses(userId, { from, to });
    const spent = monthExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const budget = await this.store.getBudget(userId);
    const status = evaluateBudget(spent, budget);

    const lines = [
      `✅ Registrado: *${formatMoney(expense.amount)}* en *${expense.category}* (${expense.description})`,
      `📈 Llevas ${formatMoney(spent)} este mes.`,
    ];

    const alert = budgetAlert(status, formatMoney);
    if (alert) lines.push('', alert);
    else if (status.level === 'ok') {
      lines.push(`👍 Vas bien: te queda ${formatMoney(status.remaining)} de tu presupuesto.`);
    }

    return lines.join('\n');
  }

  async summary(userId) {
    const now = new Date();
    const { from, to } = monthRange(now);
    const expenses = await this.store.getExpenses(userId, { from, to });
    const budget = await this.store.getBudget(userId);
    const monthLabel = `${MONTHS_ES[now.getUTCMonth()]} ${now.getUTCFullYear()}`;
    return monthlySummary(expenses, budget, monthLabel);
  }

  /** Datos crudos del mes para la interfaz web (dashboard). */
  async dashboard(userId) {
    const now = new Date();
    const { from, to } = monthRange(now);
    const [expenses, budget] = await Promise.all([
      this.store.getExpenses(userId, { from, to }),
      this.store.getBudget(userId),
    ]);
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const byCategory = {};
    for (const e of expenses) {
      byCategory[e.category] = (byCategory[e.category] ?? 0) + Number(e.amount);
    }
    const status = evaluateBudget(total, budget);
    return {
      month: `${MONTHS_ES[now.getUTCMonth()]} ${now.getUTCFullYear()}`,
      total,
      budget,
      remaining: status.remaining,
      level: status.level,
      byCategory,
      recent: [...expenses]
        .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
        .slice(0, 8)
        .map((e) => ({
        amount: Number(e.amount),
        category: e.category,
        description: e.description,
        created_at: e.created_at,
      })),
      tip: budgetAlert(status, formatMoney) ??
        (expenses.length
          ? `Tu mayor gasto del mes es ${Object.entries(byCategory).sort((a, b) => b[1] - a[1])[0][0]} — ahí está tu mejor oportunidad de ahorro.`
          : 'Registra tu primer gasto desde el chat para ver tus estadísticas aquí.'),
    };
  }

  /** CSV con los gastos del mes en curso. */
  async exportCsv(userId) {
    const { from, to } = monthRange();
    const expenses = await this.store.getExpenses(userId, { from, to });
    return toCsv(expenses);
  }

  async setBudget(userId, text) {
    const raw = text.replace(/^\/?presupuesto/i, '').trim();
    const amount = parseAmount(raw);
    if (amount == null) {
      return '🎯 Dime el monto de tu presupuesto mensual, por ejemplo: `/presupuesto 500000`';
    }
    await this.store.setBudget(userId, amount);
    return `🎯 ¡Listo! Tu presupuesto mensual quedó en *${formatMoney(amount)}*. Te avisaré si te acercas al límite.`;
  }
}
