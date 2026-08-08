/**
 * Parser heurístico de gastos en lenguaje natural (español).
 * Extrae monto y categoría de mensajes como:
 *   "gasté 15.000 en café", "25000 almuerzo", "pagué $12,50 de taxi", "15k mercado"
 */

export const CATEGORIES = [
  'comida',
  'transporte',
  'mercado',
  'entretenimiento',
  'salud',
  'servicios',
  'ropa',
  'educación',
  'otros',
];

const CATEGORY_KEYWORDS = {
  comida: ['café', 'cafe', 'almuerzo', 'desayuno', 'cena', 'restaurante', 'comida', 'hamburguesa', 'pizza', 'arepa', 'empanada', 'pollo', 'domicilio', 'rappi', 'helado', 'panadería', 'panaderia'],
  transporte: ['taxi', 'uber', 'bus', 'buseta', 'gasolina', 'transporte', 'metro', 'pasaje', 'peaje', 'parqueadero', 'moto', 'didi', 'indriver'],
  mercado: ['mercado', 'supermercado', 'tienda', 'víveres', 'viveres', 'fruta', 'verdura', 'd1', 'ara', 'éxito', 'exito', 'olímpica', 'olimpica'],
  entretenimiento: ['cine', 'película', 'pelicula', 'concierto', 'fiesta', 'cerveza', 'trago', 'juego', 'netflix', 'spotify', 'bar', 'discoteca', 'entretenimiento'],
  salud: ['medicina', 'droguería', 'drogueria', 'farmacia', 'médico', 'medico', 'doctor', 'eps', 'gimnasio', 'gym', 'salud', 'odontólogo', 'odontologo'],
  servicios: ['luz', 'agua', 'gas', 'internet', 'celular', 'plan', 'arriendo', 'recibo', 'factura', 'servicio', 'energía', 'energia', 'wifi'],
  ropa: ['ropa', 'camisa', 'zapatos', 'pantalón', 'pantalon', 'vestido', 'tenis', 'chaqueta'],
  educación: ['curso', 'libro', 'matrícula', 'matricula', 'universidad', 'colegio', 'clase', 'educación', 'educacion'],
};

/**
 * Convierte una cadena numérica en formato es-CO/es-ES a número.
 * "15.000" → 15000 · "12,50" → 12.5 · "1.234.567" → 1234567 · "15k" → 15000
 */
export function parseAmount(raw) {
  if (raw == null) return null;
  let s = String(raw).trim().toLowerCase().replace(/[$\s]/g, '');
  if (!s) return null;

  let multiplier = 1;
  if (/k$/.test(s)) {
    multiplier = 1000;
    s = s.slice(0, -1);
  }

  if (!/^[\d.,]+$/.test(s)) return null;

  const lastDot = s.lastIndexOf('.');
  const lastComma = s.lastIndexOf(',');

  if (lastDot !== -1 && lastComma !== -1) {
    // Ambos separadores: el último es el decimal.
    const decimalSep = lastDot > lastComma ? '.' : ',';
    const thousandSep = decimalSep === '.' ? ',' : '.';
    s = s.split(thousandSep).join('').replace(decimalSep, '.');
  } else if (lastDot !== -1 || lastComma !== -1) {
    const sep = lastDot !== -1 ? '.' : ',';
    const idx = lastDot !== -1 ? lastDot : lastComma;
    const digitsAfter = s.length - idx - 1;
    const occurrences = s.split(sep).length - 1;
    // "15.000" o "1.234.567" → miles · "12,50" → decimal
    if (digitsAfter === 3 || occurrences > 1) {
      s = s.split(sep).join('');
    } else {
      s = s.replace(sep, '.');
    }
  }

  const value = Number(s);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value * multiplier;
}

/**
 * Detecta la categoría por palabras clave, comparando palabras completas
 * (evita falsos positivos como "clara" ⊃ "ara"). Devuelve 'otros' si no reconoce ninguna.
 */
export function detectCategory(text) {
  const words = new Set(
    String(text)
      .toLowerCase()
      .split(/[^a-záéíóúüñ0-9]+/i)
      .filter(Boolean),
  );
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => words.has(kw))) return category;
  }
  return 'otros';
}

const AMOUNT_PATTERN = /\$?\s*\d[\d.,]*k?/i;

/**
 * Extrae { amount, category, description } de un mensaje libre.
 * Devuelve null si no encuentra un monto — el llamador decide cómo pedir aclaración.
 */
export function parseExpense(text) {
  if (!text || typeof text !== 'string') return null;

  const match = text.match(AMOUNT_PATTERN);
  if (!match) return null;

  const amount = parseAmount(match[0]);
  if (amount == null) return null;

  const description = text
    .replace(match[0], '')
    .replace(/\b(gasté|gaste|pagué|pague|compré|compre|en|de|un|una|el|la|los|las|por|me\s+costó|me\s+costo)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return {
    amount,
    category: detectCategory(text),
    description: description || 'gasto',
  };
}
