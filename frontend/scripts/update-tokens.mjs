import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const tokensFile = path.resolve(projectRoot, 'src/styles/tokens.scss');
const mapFile = path.resolve(projectRoot, 'src/styles/tokens.map.json');

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    process.exit(1);
  }
}

function updateCssVariables(css, tokenMap) {
  // Replace only values inside :root { ... } block for variables that exist in the map
  const rootStart = css.indexOf(':root');
  if (rootStart === -1) return css;
  const braceStart = css.indexOf('{', rootStart);
  if (braceStart === -1) return css;
  let depth = 1;
  let i = braceStart + 1;
  while (i < css.length && depth > 0) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') depth--;
    i++;
  }
  const braceEnd = i - 1;
  const before = css.slice(0, braceStart + 1);
  const inside = css.slice(braceStart + 1, braceEnd);
  const after = css.slice(braceEnd);

  // Update lines with format: --token-xxx: value;
  const updatedInside = inside.replace(
    /(--token-[a-z0-9-_]+)\s*:\s*([^;]+);/gi,
    (match, name, value) => {
      if (Object.prototype.hasOwnProperty.call(tokenMap, name)) {
        return `${name}: ${tokenMap[name]};`;
      }
      return match;
    }
  );

  return `${before}${updatedInside}${after}`;
}

function main() {
  const map = readJson(mapFile);
  const css = fs.readFileSync(tokensFile, 'utf8');
  const updated = updateCssVariables(css, map);
  if (updated !== css) {
    fs.writeFileSync(tokensFile, updated, 'utf8');
  } else {
  }
}

main();


