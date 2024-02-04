import type { Server } from 'bun';
import { expect, test, afterEach } from 'bun:test';

import createProxyServer from '../example/server';
import '../testServer';
import type { ReqMod } from '..';

const PROXY_SERVER_URL = 'http://localhost:8080';
const TEST_SERVER_URL = 'http://localhost:9090';

// Proxy server will be running on 8080 and will target a test server on port 9090,
// that just responds with the request body, headers, etc.
let testServer: Server;

afterEach(() => {
  testServer.stop(true);
});

test('ReqMod allows changing request method', async () => {
  const reqMod: ReqMod = () => ({ method: 'DELETE' });
  testServer = createProxyServer({ target: TEST_SERVER_URL, reqMod });
  const response = await fetch(PROXY_SERVER_URL, {
    method: 'PUT',
    body: JSON.stringify({ test: 'value' }),
    headers: {
      'content-type': 'application/json',
      'test-header': 'test-value',
      'user-agent': 'TestAgent/1.0.0',
    },
  });

  const json = await response.json();

  expect(json).toStrictEqual({
    method: 'DELETE',
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
    },
  });
});

test('ReqMod allows changing request body', async () => {
  const reqMod: ReqMod = (_req, body) => {
    const newBody = JSON.parse(body);
    newBody.test = 'changed from ReqMod';

    return {
      body: JSON.stringify(newBody),
    };
  };
  testServer = createProxyServer({ target: TEST_SERVER_URL, reqMod });
  const response = await fetch(PROXY_SERVER_URL, {
    method: 'PUT',
    body: JSON.stringify({ test: 'value' }),
    headers: {
      'content-type': 'application/json',
      'test-header': 'test-value',
      'user-agent': 'TestAgent/1.0.0',
    },
  });

  const json = await response.json();

  expect(json).toStrictEqual({
    method: 'PUT',
    url: `${TEST_SERVER_URL}/`,
    body: '{"test":"changed from ReqMod"}',
    headers: {
      'content-length': '30',
      'content-type': 'application/json',
      host: 'localhost:9090',
      'test-header': 'test-value',
      connection: 'keep-alive',
      'user-agent': 'TestAgent/1.0.0',
      accept: '*/*',
      'accept-encoding': 'gzip, deflate, br',
    },
  });
});

test('ReqMod allows changing request url', async () => {
  const newURL = new URL(`${TEST_SERVER_URL}/some/path`);

  testServer = createProxyServer({
    target: TEST_SERVER_URL,
    reqMod: () => ({ url: newURL }),
  });
  const response = await fetch(PROXY_SERVER_URL, {
    method: 'PUT',
    body: JSON.stringify({ test: 'value' }),
    headers: {
      'content-type': 'application/json',
      'test-header': 'test-value',
      'user-agent': 'TestAgent/1.0.0',
    },
  });

  const json = await response.json();

  expect(json).toStrictEqual({
    method: 'PUT',
    url: `${newURL}`,
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
    },
  });
});

test('ReqMod allows changing request headers', async () => {
  const reqMod: ReqMod = (req) => {
    const headers = req.headers;
    headers.set('test-header', 'changed from ReqMod');

    return {
      headers,
    };
  };
  testServer = createProxyServer({ target: TEST_SERVER_URL, reqMod });
  const response = await fetch(PROXY_SERVER_URL, {
    method: 'PUT',
    body: JSON.stringify({ test: 'value' }),
    headers: {
      'content-type': 'application/json',
      'test-header': 'test-value',
      'user-agent': 'TestAgent/1.0.0',
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
      'test-header': 'changed from ReqMod',
      connection: 'keep-alive',
      'user-agent': 'TestAgent/1.0.0',
      accept: '*/*',
      'accept-encoding': 'gzip, deflate, br',
    },
  });
});
