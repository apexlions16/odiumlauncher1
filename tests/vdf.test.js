const test = require('node:test');
const assert = require('node:assert/strict');
const { parseVdf } = require('../launcher/src/services/platform/vdf');

test('Steam app manifest is parsed', () => {
  const parsed = parseVdf(`"AppState" { "appid" "12345" "name" "Test Game" "installdir" "TestGame" "StateFlags" "4" }`);
  assert.equal(parsed.AppState.appid, '12345');
  assert.equal(parsed.AppState.installdir, 'TestGame');
});

test('Steam library folders with nested app metadata are parsed', () => {
  const parsed = parseVdf(`"libraryfolders" { "0" { "path" "C:\\\\Steam" "apps" { "123" "1" } } }`);
  assert.equal(parsed.libraryfolders['0'].path, 'C:\\Steam');
  assert.equal(parsed.libraryfolders['0'].apps['123'], '1');
});
