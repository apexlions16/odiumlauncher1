const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { normalizeRelativePath, resolveInside, joinUrl } = require('../launcher/src/services/paths');

test('relative paths are normalized for manifests', () => {
  assert.equal(normalizeRelativePath('Content\\Audio\\tr.pak'), 'Content/Audio/tr.pak');
  assert.equal(resolveInside('/tmp/game', 'Content/file.pak'), path.resolve('/tmp/game/Content/file.pak'));
  assert.equal(joinUrl('https://cdn.example/releases', 'Content/Türkçe ses.pak'), 'https://cdn.example/releases/Content/T%C3%BCrk%C3%A7e%20ses.pak');
});

test('path traversal is rejected', () => {
  for (const value of ['../secret', 'Content/../../secret', 'C:\\Windows\\file', '/etc/passwd']) assert.throws(() => normalizeRelativePath(value));
});
