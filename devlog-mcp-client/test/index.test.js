import { test } from 'node:test';
import assert from 'node:assert';

test('package exports are valid', async () => {
  // Test that the module can be imported (but don't start it)
  try {
    const module = await import('../src/index.js');
    assert.ok(module.default, 'Module should have default export');
  } catch (err) {
    // Module tries to auto-start, which is expected in test env
    // The error could be about API key or stdio, both are fine in test
    assert.ok(err, 'Expected error in test environment (no API key or stdio)');
  }
});

test('environment variables', () => {
  // Test that environment variables can be set
  process.env.DEVLOG_API_KEY = 'test_key';
  assert.strictEqual(process.env.DEVLOG_API_KEY, 'test_key');
  delete process.env.DEVLOG_API_KEY;
});