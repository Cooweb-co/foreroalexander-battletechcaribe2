/**
 * Capa de persistencia: Supabase (REST) en producción, memoria en desarrollo.
 * Ambas implementaciones comparten el mismo contrato:
 *   addExpense(userId, { amount, category, description }) → gasto guardado
 *   getExpenses(userId, { from, to })                     → lista de gastos
 *   setBudget(userId, amount) / getBudget(userId)         → presupuesto mensual
 */

export class MemoryStore {
  constructor() {
    this.expenses = [];
    this.budgets = new Map();
    this.nextId = 1;
  }

  async addExpense(userId, { amount, category, description }) {
    const expense = {
      id: this.nextId++,
      user_id: String(userId),
      amount,
      category,
      description,
      created_at: new Date().toISOString(),
    };
    this.expenses.push(expense);
    return expense;
  }

  async getExpenses(userId, { from, to } = {}) {
    return this.expenses.filter((e) => {
      if (e.user_id !== String(userId)) return false;
      if (from && e.created_at < from) return false;
      if (to && e.created_at >= to) return false;
      return true;
    });
  }

  async setBudget(userId, amount) {
    this.budgets.set(String(userId), amount);
  }

  async getBudget(userId) {
    return this.budgets.get(String(userId)) ?? null;
  }
}

export class SupabaseStore {
  constructor(url, serviceKey) {
    if (!url || !serviceKey) throw new Error('SupabaseStore requiere URL y service key');
    this.base = url.replace(/\/$/, '') + '/rest/v1';
    this.headers = {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
    };
  }

  async #request(path, options = {}) {
    const res = await fetch(this.base + path, { ...options, headers: { ...this.headers, ...options.headers } });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`Supabase ${res.status}: ${body.slice(0, 200)}`);
    }
    const body = await res.text();
    return body ? JSON.parse(body) : null;
  }

  async addExpense(userId, { amount, category, description }) {
    const [row] = await this.#request('/expenses', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({ user_id: String(userId), amount, category, description }),
    });
    return row;
  }

  async getExpenses(userId, { from, to } = {}) {
    const params = new URLSearchParams({ user_id: `eq.${userId}`, order: 'created_at.desc' });
    if (from) params.append('created_at', `gte.${from}`);
    if (to) params.append('created_at', `lt.${to}`);
    return this.#request(`/expenses?${params}`);
  }

  async setBudget(userId, amount) {
    await this.#request('/budgets', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ user_id: String(userId), amount }),
    });
  }

  async getBudget(userId) {
    const params = new URLSearchParams({ user_id: `eq.${userId}`, select: 'amount' });
    const rows = await this.#request(`/budgets?${params}`);
    return rows[0]?.amount ?? null;
  }
}

/** Elige la implementación según las variables de entorno disponibles. */
export function createStore(env = process.env) {
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    return new SupabaseStore(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  }
  console.warn('⚠️  Sin credenciales de Supabase — usando almacenamiento en memoria (solo desarrollo).');
  return new MemoryStore();
}
