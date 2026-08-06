const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const crypto = require('node:crypto');
const { StateStore } = require('../launcher/src/services/state-store');
const { PatchService } = require('../launcher/src/services/patch-service');

function hash(value) { return crypto.createHash('sha256').update(value).digest('hex'); }

test('patch install falls back to secondary source and uninstall restores original', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'odium-patch-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const installRoot = path.join(root, 'game');
  const target = path.join(installRoot, 'Content', 'Audio', 'voice.pak');
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, 'original');

  const dubbed = Buffer.from('turkish-dub');
  const server = http.createServer((request, response) => {
    if (request.url.startsWith('/primary/')) { response.writeHead(503); response.end('offline'); return; }
    if (request.url === '/fallback/Content/Audio/voice.pak') { response.writeHead(200, { 'Content-Length': dubbed.length }); response.end(dubbed); return; }
    response.writeHead(404); response.end();
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;

  const game = { id: 'test-game', title: 'Test Game', release: { primaryBaseUrl: `${base}/primary/`, fallbackBaseUrl: `${base}/fallback/` } };
  const install = { platform: 'steam', installPath: installRoot };
  const manifest = { gameId: game.id, version: '1.0.0', files: [{ path: 'Content/Audio/voice.pak', contentPath: 'Content/Audio/voice.pak', size: dubbed.length, sha256: hash(dubbed), mode: 'replace' }] };
  const service = new PatchService({ stateStore: new StateStore(path.join(root, 'state')) });
  const analysis = await service.analyze(game, install, manifest);
  assert.equal(analysis.status, 'available');
  await service.install(game, install, manifest, analysis);
  assert.equal(await fs.readFile(target, 'utf8'), 'turkish-dub');
  assert.equal((await service.analyze(game, install, manifest)).status, 'installed');
  const result = await service.uninstall(game, install);
  assert.equal(result.restored, 1);
  assert.equal(await fs.readFile(target, 'utf8'), 'original');
});

test('external game verification clears stale installation state', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'odium-reconcile-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const installRoot = path.join(root, 'game');
  await fs.mkdir(installRoot, { recursive: true });
  await fs.writeFile(path.join(installRoot, 'file.bin'), 'official');
  const store = new StateStore(path.join(root, 'state'));
  await store.save('test-game', { version: '1.0.0', files: [{ path: 'file.bin' }] });
  const service = new PatchService({ stateStore: store });
  const manifest = { version: '1.0.0', files: [{ path: 'file.bin', size: 6, sha256: hash('dubbed'), mode: 'replace' }] };
  const analysis = await service.analyze({ id: 'test-game' }, { installPath: installRoot }, manifest);
  assert.equal(analysis.status, 'removed-externally');
  assert.equal(await store.get('test-game'), null);
});
