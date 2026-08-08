/**
 * Punto de entrada de FinBot: carga .env, arma las piezas y arranca el bot.
 */
import { readFileSync } from 'node:fs';
import { createStore } from './store.js';
import { FinBot } from './finbot.js';
import { TelegramBot } from './bot.js';

// Carga .env sin dependencias (las variables ya definidas tienen prioridad).
try {
  for (const line of readFileSync('.env', 'utf8').split('\n')) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
} catch {
  // Sin .env: se usan las variables del entorno.
}

const store = createStore();
const finbot = new FinBot(store);
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, finbot);

process.on('SIGINT', () => {
  console.log('\n👋 Apagando FinBot...');
  bot.stop();
  process.exit(0);
});

bot.start().catch((err) => {
  console.error('Error fatal:', err.message);
  process.exit(1);
});
