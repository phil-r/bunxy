import { Server } from 'bun';
import { expect, test, afterEach } from 'bun:test';

import createProxyServer from '../example/server';
import '../testServer/dumb';
import { ResMod } from '..';

const PROXY_SERVER_URL = 'http://localhost:8080';
const TEST_SERVER_URL = 'http://localhost:8484';

// Proxy server will be running on 8080 and will target a test server on port 8484,
// that just responds with a simple response.
let testServer: Server;

afterEach(() => {
  testServer.stop(true);
});

test('ResMod allows changing response headers', async () => {
  const resMod: ResMod = (res) => {
    res.headers.set('x-test-header', 'test-value');
    return res;
  };
  testServer = createProxyServer({ target: TEST_SERVER_URL, resMod });
  const response = await fetch(PROXY_SERVER_URL);

  expect(response.headers.get('x-test-header')).toBe('test-value');
  expect(response.status).toBe(200);

  const json = await response.json();

  expect(json).toStrictEqual({
    answer: 42,
  });
});

test('ResMod allows changing response body', async () => {
  const resMod: ResMod = async (res) => {
    const body = await res.json();
    const response = new Response(JSON.stringify({ answer: body.answer * 2 }));
    return response;
  };
  testServer = createProxyServer({ target: TEST_SERVER_URL, resMod });
  const response = await fetch(PROXY_SERVER_URL);

  expect(response.status).toBe(200);

  const json = await response.json();

  expect(json).toStrictEqual({
    answer: 84,
  });
});

test('ResMod allows changing response status', async () => {
  const resMod: ResMod = async (res) => {
    const response = new Response(res.body, { status: 404 });
    return response;
  };
  testServer = createProxyServer({ target: TEST_SERVER_URL, resMod });
  const response = await fetch(PROXY_SERVER_URL);

  expect(response.status).toBe(404);

  const json = await response.json();

  expect(json).toStrictEqual({
    answer: 42,
  });
});
