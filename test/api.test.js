import { test } from 'node:test';
import assert from 'node:assert/strict';
import chatHandler from '../api/chat.js';
import dashboardHandler from '../api/dashboard.js';
import exportHandler from '../api/export.js';

/** Mock mínimo del res de Vercel. */
function mockRes() {
  const res = {
    statusCode: null,
    body: null,
    headers: {},
    status(code) { res.statusCode = code; return res; },
    json(obj) { res.body = obj; return res; },
    send(data) { res.body = data; return res; },
    setHeader(k, v) { res.headers[k] = v; },
  };
  return res;
}

test('api/chat: registra un gasto y responde', async () => {
  const res = mockRes();
  await chatHandler({ method: 'POST', body: { userId: 'api-u1', text: 'gasté 10.000 en café' } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(res.body.reply, /Registrado/);
});

test('api/chat: método y userId inválidos son rechazados', async () => {
  const r1 = mockRes();
  await chatHandler({ method: 'GET', body: {} }, r1);
  assert.equal(r1.statusCode, 405);

  const r2 = mockRes();
  await chatHandler({ method: 'POST', body: { userId: 'a&or=(x)', text: 'hola' } }, r2);
  assert.equal(r2.statusCode, 400);
});

test('api/dashboard: devuelve agregados del usuario', async () => {
  const res = mockRes();
  await dashboardHandler({ method: 'GET', query: { userId: 'api-u1' } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(typeof res.body.total, 'number');
  assert.ok(res.body.byCategory);
});

test('api/export: entrega CSV con cabeceras de descarga', async () => {
  const res = mockRes();
  await exportHandler({ method: 'GET', query: { userId: 'api-u1' } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(res.headers['Content-Type'], /text\/csv/);
  assert.match(res.headers['Content-Disposition'], /attachment/);
  assert.match(String(res.body), /"fecha","monto","categoria","descripcion"/);
});
