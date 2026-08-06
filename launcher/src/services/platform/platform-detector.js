const { detectSteamGame } = require('./steam-detector');
const { detectEpicGame } = require('./epic-detector');

async function detectInstalledGame(game) {
  const [steam, epic] = await Promise.all([
    detectSteamGame(game),
    detectEpicGame(game)
  ]);
  return steam || epic || null;
}

module.exports = { detectInstalledGame };
