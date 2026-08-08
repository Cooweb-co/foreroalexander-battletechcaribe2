/**
 * Lógica de presupuesto mensual y alertas.
 */

/** Rango [inicio, fin) del mes de una fecha, en ISO. */
export function monthRange(date = new Date()) {
  const from = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const to = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
  return { from: from.toISOString(), to: to.toISOString() };
}

/**
 * Evalúa el estado del presupuesto tras un gasto.
 * @returns {{ level: 'ok'|'warning'|'exceeded'|'none', spent, budget, remaining, ratio }}
 */
export function evaluateBudget(spent, budget) {
  if (budget == null || budget <= 0) {
    return { level: 'none', spent, budget: null, remaining: null, ratio: null };
  }
  const ratio = spent / budget;
  const remaining = budget - spent;
  let level = 'ok';
  if (ratio >= 1) level = 'exceeded';
  else if (ratio >= 0.8) level = 'warning';
  return { level, spent, budget, remaining, ratio };
}

/** Mensaje de alerta según el estado del presupuesto (null si no aplica). */
export function budgetAlert(status, fmt) {
  switch (status.level) {
    case 'exceeded':
      return `🚨 *¡Presupuesto superado!* Llevas ${fmt(status.spent)} de ${fmt(status.budget)} este mes (${Math.round(status.ratio * 100)}%). Frena un poco 🙏`;
    case 'warning':
      return `⚠️ Ojo: ya usaste el ${Math.round(status.ratio * 100)}% de tu presupuesto. Te quedan ${fmt(status.remaining)} para el resto del mes.`;
    default:
      return null;
  }
}
