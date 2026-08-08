/**
 * Integración con Telegram vía long polling (getUpdates).
 * Sin dependencias: fetch nativo contra la Bot API oficial.
 */

export class TelegramBot {
  constructor(token, finbot) {
    if (!token) throw new Error('TELEGRAM_BOT_TOKEN es obligatorio para iniciar el bot');
    this.api = `https://api.telegram.org/bot${token}`;
    this.finbot = finbot;
    this.offset = 0;
    this.running = false;
  }

  async #call(method, payload) {
    const res = await fetch(`${this.api}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(`Telegram ${method}: ${data.description}`);
    return data.result;
  }

  async sendMessage(chatId, text) {
    try {
      await this.#call('sendMessage', { chat_id: chatId, text, parse_mode: 'Markdown' });
    } catch {
      // Si el Markdown viene mal formado, reintenta en texto plano antes de rendirse.
      await this.#call('sendMessage', { chat_id: chatId, text });
    }
  }

  async #handleUpdate(update) {
    const message = update.message;
    if (!message?.text || !message.chat) return;

    const userId = String(message.from?.id ?? message.chat.id);
    try {
      await this.#call('sendChatAction', { chat_id: message.chat.id, action: 'typing' });
      const reply = await this.finbot.handleMessage(userId, message.text);
      await this.sendMessage(message.chat.id, reply);
    } catch (err) {
      console.error('Error procesando mensaje:', err.message);
      await this.sendMessage(
        message.chat.id,
        '😓 Tuve un problema procesando tu mensaje. Inténtalo de nuevo en un momento.',
      ).catch(() => {});
    }
  }

  async start() {
    this.running = true;
    const me = await this.#call('getMe', {});
    console.log(`🤖 FinBot en línea como @${me.username}`);

    while (this.running) {
      try {
        const updates = await this.#call('getUpdates', {
          offset: this.offset,
          timeout: 30,
          allowed_updates: ['message'],
        });
        for (const update of updates) {
          this.offset = update.update_id + 1;
          await this.#handleUpdate(update);
        }
      } catch (err) {
        console.error('Error en polling:', err.message);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  stop() {
    this.running = false;
  }
}
