/**
 * Extracción de gastos con OpenAI (categorización inteligente).
 * Si no hay API key o la llamada falla, cae al parser heurístico local.
 */
import { parseExpense, CATEGORIES } from './parser.js';

const SYSTEM_PROMPT = `Eres el motor de extracción de FinBot, un asistente financiero en español.
Del mensaje del usuario extrae el gasto y responde SOLO con JSON válido:
{"amount": <número positivo>, "category": <una de: ${CATEGORIES.join(', ')}>, "description": "<breve, 2-4 palabras>"}
Si el mensaje NO contiene un gasto con monto identificable, responde: {"amount": null}
Notas: "15.000" en español significa quince mil (15000). "15k" = 15000.`;

/**
 * Consejo financiero personalizado según el resumen del mes.
 * Nunca lanza: sin API key o ante fallo devuelve null (el llamador tiene fallback).
 */
export async function getAdvice(summaryData, env = process.env) {
  if (!env.OPENAI_API_KEY) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0.7,
        max_tokens: 220,
        messages: [
          {
            role: 'system',
            content:
              'Eres FinBot, un asesor financiero colombiano cercano y directo. ' +
              'Con los datos del mes del usuario, da UN consejo concreto y accionable en máximo 3 frases, ' +
              'en español, con tono amable. Puedes usar 1-2 emojis. Montos en pesos colombianos.',
          },
          { role: 'user', content: JSON.stringify(summaryData) },
        ],
        signal: undefined,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch (err) {
    console.warn(`IA no disponible para consejo (${err.message}).`);
    return null;
  }
}

/**
 * Intenta extraer el gasto con IA; devuelve el mismo shape que parseExpense.
 * Nunca lanza: ante cualquier fallo usa el fallback heurístico.
 */
export async function extractExpense(text, env = process.env) {
  if (!env.OPENAI_API_KEY) return parseExpense(text);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL || 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) throw new Error(`OpenAI ${res.status}`);

    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);

    if (parsed.amount == null) return null;
    const amount = Number(parsed.amount);
    if (!Number.isFinite(amount) || amount <= 0) return null;

    return {
      amount,
      category: CATEGORIES.includes(parsed.category) ? parsed.category : 'otros',
      description: String(parsed.description || 'gasto').slice(0, 80),
    };
  } catch (err) {
    console.warn(`IA no disponible (${err.message}) — usando parser heurístico.`);
    return parseExpense(text);
  }
}
