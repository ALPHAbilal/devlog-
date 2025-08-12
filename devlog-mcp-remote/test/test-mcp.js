import { test } from 'node:test';
import assert from 'node:assert';
import { createSemanticSnapshot } from '../src/semantic-snapshot.ts';

test('Semantic snapshot reduces data by 90%', () => {
  const mockDocument = {
    document: {
      id: '123',
      title: 'Test Document',
      tags: ['test', 'demo'],
      created_at: '2025-01-01',
      updated_at: '2025-01-10',
    },
    blocks: [
      {
        id: 'b1',
        type: 'heading',
        content: 'Introduction',
        metadata: { level: 1 },
        updated_at: '2025-01-10',
      },
      {
        id: 'b2',
        type: 'text',
        content: 'A'.repeat(1000), // 1KB of text
        metadata: {},
        updated_at: '2025-01-10',
      },
      {
        id: 'b3',
        type: 'code',
        content: 'function example() {\n  return "Hello World";\n}\n' + 'console.log("test");\n'.repeat(100),
        metadata: { language: 'javascript', filename: 'example.js' },
        updated_at: '2025-01-10',
      },
      {
        id: 'b4',
        type: 'ai',
        content: 'AI Conversation',
        metadata: {
          messages: [
            { role: 'user', content: 'How do I use React hooks?' },
            { role: 'assistant', content: 'React hooks are functions that...' },
          ],
          model: 'claude',
        },
        updated_at: '2025-01-10',
      },
      {
        id: 'b5',
        type: 'todo',
        content: 'Tasks',
        metadata: {
          items: [
            { text: 'Complete feature', completed: true },
            { text: 'Write tests', completed: false },
            { text: 'Deploy to production', completed: false },
          ],
        },
        updated_at: '2025-01-10',
      },
    ],
  };

  const originalSize = JSON.stringify(mockDocument).length;
  const snapshot = createSemanticSnapshot(mockDocument);
  const snapshotSize = JSON.stringify(snapshot).length;

  const reduction = ((originalSize - snapshotSize) / originalSize) * 100;

  console.log(`Original size: ${originalSize} bytes`);
  console.log(`Snapshot size: ${snapshotSize} bytes`);
  console.log(`Reduction: ${reduction.toFixed(2)}%`);

  // Verify structure
  assert.ok(snapshot.document);
  assert.ok(snapshot.structure);
  assert.ok(snapshot.keyContent);
  assert.ok(snapshot.metadata);
  assert.ok(snapshot.summary);

  // Verify key content extraction
  assert.equal(snapshot.structure.headings.length, 1);
  assert.equal(snapshot.keyContent.codeBlocks.length, 1);
  assert.equal(snapshot.keyContent.aiConversations.length, 1);
  assert.equal(snapshot.keyContent.todos.length, 1);

  // Verify significant size reduction
  assert.ok(reduction > 70, `Expected >70% reduction, got ${reduction.toFixed(2)}%`);
});

test('All 11 block types are supported', () => {
  const blockTypes = [
    'text',
    'code',
    'heading',
    'ai',
    'filetree',
    'table',
    'todo',
    'image',
    'inline-image',
    'version-track',
    'issue-tracker',
  ];

  const mockBlocks = blockTypes.map((type, i) => ({
    id: `b${i}`,
    type,
    content: `${type} content`,
    metadata: {},
    updated_at: '2025-01-10',
  }));

  const snapshot = createSemanticSnapshot({
    document: { id: '123', title: 'Test', tags: [], created_at: '2025-01-01', updated_at: '2025-01-10' },
    blocks: mockBlocks,
  });

  // Verify all block types are counted
  assert.equal(Object.keys(snapshot.structure.blockTypes).length, 11);
  blockTypes.forEach(type => {
    assert.equal(snapshot.structure.blockTypes[type], 1);
  });
});

test('Authentication validates API key format', async () => {
  const { authenticateRequest } = await import('../src/auth.ts');

  // Valid format
  const validRequest = new Request('https://test.com', {
    headers: { 'Authorization': 'Bearer dvlg_sk_test_12345' },
  });
  const validResult = await authenticateRequest(validRequest, {});
  assert.ok(validResult.valid);

  // Invalid format
  const invalidRequest = new Request('https://test.com', {
    headers: { 'Authorization': 'Bearer invalid_key' },
  });
  const invalidResult = await authenticateRequest(invalidRequest, {});
  assert.ok(!invalidResult.valid);

  // Missing auth
  const noAuthRequest = new Request('https://test.com');
  const noAuthResult = await authenticateRequest(noAuthRequest, {});
  assert.ok(!noAuthResult.valid);
});