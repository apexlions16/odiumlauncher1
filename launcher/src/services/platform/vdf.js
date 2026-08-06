function tokenizeVdf(input) {
  const tokens = [];
  let index = 0;

  while (index < input.length) {
    const char = input[index];
    if (/\s/.test(char)) {
      index += 1;
      continue;
    }
    if (char === '/' && input[index + 1] === '/') {
      while (index < input.length && input[index] !== '\n') index += 1;
      continue;
    }
    if (char === '{' || char === '}') {
      tokens.push(char);
      index += 1;
      continue;
    }
    if (char === '"') {
      index += 1;
      let value = '';
      while (index < input.length) {
        if (input[index] === '\\' && index + 1 < input.length) {
          const escaped = input[index + 1];
          value += escaped === 'n' ? '\n' : escaped;
          index += 2;
          continue;
        }
        if (input[index] === '"') {
          index += 1;
          break;
        }
        value += input[index];
        index += 1;
      }
      tokens.push(value);
      continue;
    }

    let value = '';
    while (index < input.length && !/\s|\{|\}/.test(input[index])) {
      value += input[index++];
    }
    if (value) tokens.push(value);
  }

  return tokens;
}

function parseVdf(input) {
  const tokens = tokenizeVdf(input);
  let cursor = 0;

  function parseObject(stopAtBrace = false) {
    const result = {};
    while (cursor < tokens.length) {
      const token = tokens[cursor++];
      if (token === '}') {
        if (stopAtBrace) return result;
        throw new Error('Beklenmeyen VDF kapanış parantezi.');
      }
      if (token === '{') throw new Error('VDF anahtarı beklenirken blok başladı.');

      const next = tokens[cursor++];
      if (next === '{') {
        result[token] = parseObject(true);
      } else if (next === undefined || next === '}') {
        throw new Error(`VDF değeri eksik: ${token}`);
      } else {
        result[token] = next;
      }
    }
    if (stopAtBrace) throw new Error('VDF bloğu kapanmadı.');
    return result;
  }

  return parseObject(false);
}

module.exports = { tokenizeVdf, parseVdf };
