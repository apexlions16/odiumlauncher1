const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { buildManifest } = require('../admin/src/manifest-builder');

test('manifest builder preserves relative paths and hashes files', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'odium-manifest-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'Content', 'Audio'), { recursive: true });
  await fs.writeFile(path.join(root, 'Content', 'Audio', 'tr.pak'), 'dublaj');
  const manifest = await buildManifest({ directory: root, gameId: 'test-game', version: '1.0.0' });
  assert.equal(manifest.files.length, 1);
  assert.equal(manifest.files[0].path, 'Content/Audio/tr.pak');
  assert.match(manifest.files[0].sha256, /^[a-f0-9]{64}$/);
  assert.equal(JSON.parse(await fs.readFile(path.join(root, 'manifest.json'), 'utf8')).version, '1.0.0');
});
