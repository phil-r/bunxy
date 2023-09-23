import { Server } from 'bun';
import { expect, test, afterAll, beforeAll } from 'bun:test';

import { createProxy } from '.';
import createProxyServer from './example/server';
import './testServer';

const PROXY_SERVER_URL = 'http://localhost:8080';
const TEST_SERVER_URL = 'http://localhost:9090';

// Proxy server will be running on 8080 and will target a test server on port 9090,
// that just responds with the request body, headers, etc.
let testServer: Server;

beforeAll(() => {
  testServer = createProxyServer({ target: TEST_SERVER_URL });
  console.log('running tests.');
});

afterAll(() => {
  testServer.stop(true);
  console.log('done with tests.');
});

test('Creating proxy', () => {
  expect(createProxy({ target: 'https://example.com' })).toBeDefined();
  expect(createProxy({ target: 'http://example.com' })).toBeDefined();
  expect(createProxy({ target: 'http://localhost' })).toBeDefined();
  expect(createProxy({ target: 'http://localhost:8888' })).toBeDefined();
  expect(createProxy({ target: 'http://0.0.0.0' })).toBeDefined();
  expect(createProxy.bind(null, { target: 'ws://example.com' })).toThrow(
    'Invalid target',
  );
  expect(createProxy.bind(null, { target: 'example.com' })).toThrow(
    'Invalid target',
  );
  expect(createProxy.bind(null, { target: 'localhost' })).toThrow(
    'Invalid target',
  );
  expect(createProxy.bind(null, { target: '0.0.0.0' })).toThrow(
    'Invalid target',
  );
});

test('Proxy server response matches expected response', async () => {
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
      'test-header': 'test-value',
      connection: 'keep-alive',
      'user-agent': 'TestAgent/1.0.0',
      accept: '*/*',
      'accept-encoding': 'gzip, deflate',
    },
  });
});

test('Proxy server response matches the test server response', async () => {
  const args = {
    method: 'PUT',
    body: JSON.stringify({ test: 'value' }),
    headers: {
      'content-type': 'application/json',
      'test-header': 'test-value',
      'user-agent': 'TestAgent/1.0.0',
    },
  };

  const path = '/some/path';

  const referenceResponse = await fetch(`${TEST_SERVER_URL}${path}`, args);
  const referenceJson = await referenceResponse.json();

  const response = await fetch(`${PROXY_SERVER_URL}${path}`, args);
  const json = await response.json();

  expect(json).toStrictEqual(referenceJson);
});
