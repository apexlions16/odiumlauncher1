const fs = require('node:fs');
const fsPromises = require('node:fs/promises');
const crypto = require('node:crypto');

async function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', reject);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

async function inspectFile(filePath, expected = null) {
  try {
    const stat = await fsPromises.stat(filePath);
    if (!stat.isFile()) return { exists: false, matches: false, reason: 'not-file' };

    if (expected && Number.isFinite(expected.size) && stat.size !== expected.size) {
      return { exists: true, matches: false, size: stat.size, reason: 'size' };
    }

    const sha256 = await sha256File(filePath);
    return {
      exists: true,
      matches: expected ? sha256.toLowerCase() === expected.sha256.toLowerCase() : true,
      size: stat.size,
      sha256,
      reason: expected && sha256.toLowerCase() !== expected.sha256.toLowerCase() ? 'hash' : null
    };
  } catch (error) {
    if (error.code === 'ENOENT') return { exists: false, matches: false, reason: 'missing' };
    throw error;
  }
}

module.exports = { sha256File, inspectFile };
