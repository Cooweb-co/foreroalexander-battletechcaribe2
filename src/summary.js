/**
 * Resúmenes financieros formateados para Telegram (Markdown).
 */

const CATEGORY_EMOJI = {
  comida: '🍽️',
  transporte: '🚕',
  mercado: '🛒',
  entretenimiento: '🎬',
  salud: '💊',
  servicios: '💡',
  ropa: '👕',
  educación: '📚',
  otros: '📦',
};

export function formatMoney(value) {
  return '$' + Number(value).toLocaleString('es-CO', { maximumFractionDigits: 2 });
}

/** Agrupa gastos por categoría, ordenados de mayor a menor. */
export function groupByCategory(expenses) {
  const totals = new Map();
  for (const e of expenses) {
    totals.set(e.category, (totals.get(e.category) ?? 0) + Number(e.amount));
  }
  return [...totals.entries()].sort((a, b) => b[1] - a[1]);
}

/** Resumen mensual en Markdown para el chat. */
export function monthlySummary(expenses, budget, monthLabel) {
  if (expenses.length === 0) {
    return `📭 Aún no tienes gastos registrados en ${monthLabel}.\n\nEscríbeme algo como _"gasté 15.000 en café"_ para empezar. ☕`;
  }

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const groups = groupByCategory(expenses);
  const top = groups[0];

  const lines = [
    `📊 *Resumen de ${monthLabel}*`,
    '',
    ...groups.map(([cat, amount]) => {
      const pct = Math.round((amount / total) * 100);
      return `${CATEGORY_EMOJI[cat] ?? '📦'} ${cat}: *${formatMoney(amount)}* (${pct}%)`;
    }),
    '',
    `💰 Total: *${formatMoney(total)}* en ${expenses.length} gasto${expenses.length === 1 ? '' : 's'}`,
  ];

  if (budget != null && budget > 0) {
    const pct = Math.round((total / budget) * 100);
    const bar = progressBar(total / budget);
    lines.push(`🎯 Presupuesto: ${bar} ${pct}% de ${formatMoney(budget)}`);
  }

  lines.push('', `💡 Tu mayor gasto es *${top[0]}* — ahí está tu mejor oportunidad de ahorro.`);
  return lines.join('\n');
}

/**
 * Exporta gastos a CSV (RFC 4180: comillas escapadas, CRLF).
 * Los campos que empiezan con = + - @ \t \r se prefijan con ' para
 * neutralizar inyección de fórmulas al abrir el archivo en Excel/Sheets.
 */
export function toCsv(expenses) {
  const escape = (v) => {
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return `"${s.replaceAll('"', '""')}"`;
  };
  const rows = [
    ['fecha', 'monto', 'categoria', 'descripcion'],
    ...expenses.map((e) => [e.created_at, e.amount, e.category, e.description]),
  ];
  return rows.map((r) => r.map(escape).join(',')).join('\r\n') + '\r\n';
}

/** Barra de progreso visual: ▓▓▓▓░░░░░░ */
export function progressBar(ratio, width = 10) {
  const filled = Math.min(width, Math.round(Math.max(0, ratio) * width));
  return '▓'.repeat(filled) + '░'.repeat(width - filled);
}
