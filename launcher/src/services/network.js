const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const path = require('node:path');
const { Readable, Transform } = require('node:stream');
const { pipeline } = require('node:stream/promises');

async function fetchWithTimeout(url, options = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error('İstek zaman aşımına uğradı.')), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: options.signal || controller.signal,
      headers: {
        'User-Agent': 'OdiumLauncher/0.1',
        Accept: '*/*',
        ...(options.headers || {})
      }
    });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchJson(url, options = {}) {
  const response = await fetchWithTimeout(url, {
    ...options,
    headers: { Accept: 'application/json', ...(options.headers || {}) }
  }, options.timeoutMs || 20000);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

async function downloadFile(url, destination, options = {}) {
  await fsPromises.mkdir(path.dirname(destination), { recursive: true });
  const response = await fetchWithTimeout(url, {}, options.timeoutMs || 60000);
  if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}: ${url}`);

  const total = Number(response.headers.get('content-length') || 0);
  let received = 0;
  const progress = new Transform({
    transform(chunk, _encoding, callback) {
      received += chunk.length;
      options.onProgress?.({ received, total, url });
      callback(null, chunk);
    }
  });

  const output = fs.createWriteStream(destination, { flags: 'w' });
  try {
    await pipeline(Readable.fromWeb(response.body), progress, output);
  } catch (error) {
    await fsPromises.rm(destination, { force: true }).catch(() => {});
    throw error;
  }
  return { received, total };
}

module.exports = { fetchWithTimeout, fetchJson, downloadFile };
