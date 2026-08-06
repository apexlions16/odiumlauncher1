#!/usr/bin/env node
const path = require('node:path');
const { buildManifest } = require('../admin/src/manifest-builder');

function parseArguments(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) continue;
    values[key.slice(2)] = argv[index + 1];
    index += 1;
  }
  return values;
}

async function main() {
  const args = parseArguments(process.argv.slice(2));
  if (!args.dir || !args.game || !args.version) {
    console.error('Kullanım: node tools/build-manifest.js --dir <dublaj-klasörü> --game <oyun-id> --version <1.0.0>');
    process.exitCode = 1;
    return;
  }
  const directory = path.resolve(args.dir);
  const manifest = await buildManifest({ directory, gameId: args.game, version: args.version });
  const size = manifest.files.reduce((sum, file) => sum + file.size, 0);
  console.log(`${manifest.files.length} dosya için manifest oluşturuldu (${size} bayt).`);
  console.log(path.join(directory, 'manifest.json'));
}

main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
