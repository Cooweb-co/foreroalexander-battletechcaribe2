/**
 * Demo interactivo de FinBot en la terminal — sin Telegram ni credenciales.
 *   npm run demo
 */
import { createInterface } from 'node:readline/promises';
import { MemoryStore } from '../src/store.js';
import { FinBot } from '../src/finbot.js';
import { WELCOME } from '../src/finbot.js';

const finbot = new FinBot(new MemoryStore());
const rl = createInterface({ input: process.stdin, output: process.stdout });

const strip = (md) => md.replace(/[*_`]/g, '');

console.log('═'.repeat(50));
console.log('  💰 FinBot — demo local (Ctrl+C para salir)');
console.log('═'.repeat(50));
console.log('\n' + strip(WELCOME) + '\n');

process.stdout.write('Tú › ');
for await (const input of rl) {
  if (input.trim()) {
    const reply = await finbot.handleMessage('demo-user', input);
    console.log('\nFinBot › ' + strip(reply) + '\n');
  }
  process.stdout.write('Tú › ');
}
