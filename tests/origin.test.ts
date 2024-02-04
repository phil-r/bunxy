import { Server } from 'bun';
import { expect, test, afterEach } from 'bun:test';

import createProxyServer from '../example/server';
import '../testServer';
import { ReqMod } from '..';

const PROXY_SERVER_URL = 'http://localhost:8080';
const TEST_SERVER_URL = 'http://localhost:9090';

// Proxy server will be running on 8080 and will target a test server on port 9090,
// that just responds with the request body, headers, etc.
let testServer: Server;

afterEach(() => {
  testServer.stop(true);
});

test('Origin header is updated by default', async () => {
  testServer = createProxyServer({ target: TEST_SERVER_URL });
  const response = await fetch(PROXY_SERVER_URL, {
    method: 'PUT',
    body: JSON.stringify({ test: 'value' }),
    headers: {
      'content-type': 'application/json',
      'test-header': 'test-value',
      'user-agent': 'TestAgent/1.0.0',
      origin: PROXY_SERVER_URL,
    },
  });

  const json = await response.json();

  expect(json).toStrictEqual({
    method: 'PUT',
    url: `${TEST_SERVER_URL}/`,
    body: '{"test":"value"}',
    headers: {
      'content-length': '16',
      'content-type': 'application/json',
      host: 'localhost:9090',
      origin: TEST_SERVER_URL,
      'test-header': 'test-value',
      connection: 'keep-alive',
      'user-agent': 'TestAgent/1.0.0',
      accept: '*/*',
      'accept-encoding': 'gzip, deflate, br',
    },
  });
});

test('Origin header update can be disabled', async () => {
  testServer = createProxyServer({
    target: TEST_SERVER_URL,
    updateOrigin: false,
  });
  const response = await fetch(PROXY_SERVER_URL, {
    method: 'PUT',
    body: JSON.stringify({ test: 'value' }),
    headers: {
      'content-type': 'application/json',
      'test-header': 'test-value',
      'user-agent': 'TestAgent/1.0.0',
      origin: PROXY_SERVER_URL,
    },
  });

  const json = await response.json();

  expect(json).toStrictEqual({
    method: 'PUT',
    url: `${TEST_SERVER_URL}/`,
    body: '{"test":"value"}',
    headers: {
      'content-length': '16',
      'content-type': 'application/json',
      host: 'localhost:9090',
      origin: PROXY_SERVER_URL,
      'test-header': 'test-value',
      connection: 'keep-alive',
      'user-agent': 'TestAgent/1.0.0',
      accept: '*/*',
      'accept-encoding': 'gzip, deflate, br',
    },
  });
});

test('Origin header can be updated with reqMod', async () => {
  const reqMod: ReqMod = (req) => {
    const headers = req.headers;
    headers.set('origin', TEST_SERVER_URL);
    return {
      headers,
    };
  };
  testServer = createProxyServer({
    target: TEST_SERVER_URL,
    reqMod,
    updateOrigin: false,
  });
  const response = await fetch(PROXY_SERVER_URL, {
    method: 'PUT',
    body: JSON.stringify({ test: 'value' }),
    headers: {
      'content-type': 'application/json',
      'test-header': 'test-value',
      'user-agent': 'TestAgent/1.0.0',
      origin: PROXY_SERVER_URL,
    },
  });

  const json = await response.json();

  expect(json).toStrictEqual({
    method: 'PUT',
    url: `${TEST_SERVER_URL}/`,
    body: '{"test":"value"}',
    headers: {
      'content-length': '16',
      'content-type': 'application/json',
      host: 'localhost:9090',
      'test-header': 'test-value',
      connection: 'keep-alive',
      'user-agent': 'TestAgent/1.0.0',
      accept: '*/*',
      'accept-encoding': 'gzip, deflate, br',
      origin: TEST_SERVER_URL,
    },
  });
});
