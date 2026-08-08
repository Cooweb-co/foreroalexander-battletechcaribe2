# 💰 FinBot — Tu Asesor Financiero Personal

Chatbot de Telegram que entiende lenguaje natural en español para registrar tus gastos y darte consejos financieros en tiempo real.

> _"gasté 15.000 en café"_ → ☕ registrado, categorizado y comparado contra tu presupuesto. Así de simple.

## ✨ Funcionalidades

- **Registro en lenguaje natural**: escribe como hablas — `"25.000 almuerzo"`, `"pagué $40.000 de taxi"`.
- **Categorización automática con IA** (OpenAI) + fallback heurístico si no hay API key.
- **Resumen mensual** con totales por categoría: comando `/resumen`.
- **Presupuesto y alertas**: define tu tope con `/presupuesto 500000` y FinBot te avisa si lo superas.
- **Persistencia en Supabase** con fallback en memoria para desarrollo local.

## 🚀 Inicio rápido

```bash
cp .env.example .env   # completa tus credenciales
npm start              # inicia el bot de Telegram
npm run demo           # modo demo local (sin Telegram)
npm test               # corre la suite de tests
```

## 🏗️ Arquitectura

```
src/
  parser.js    → extracción de monto y categoría (heurística ES)
  ai.js        → categorización con OpenAI (con fallback)
  store.js     → persistencia (Supabase / memoria)
  budget.js    → presupuestos y alertas
  summary.js   → resúmenes mensuales
  bot.js       → integración Telegram (long polling)
  index.js     → punto de entrada
```

Sin dependencias externas: solo Node.js ≥18 con `fetch` nativo. Cero riesgo de cadena de suministro.

## 🔐 Seguridad

- Los secretos viven **solo** en `.env` (ignorado por git).
- Comunicación exclusivamente por HTTPS con las APIs oficiales.
- Sin dependencias de terceros que auditar.
