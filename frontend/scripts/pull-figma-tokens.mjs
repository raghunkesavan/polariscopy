import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd());
const cfgFile = path.resolve(projectRoot, 'figma.config.json');
const aliasesFile = path.resolve(projectRoot, 'src/styles/token-aliases.json');
const reportFile = path.resolve(projectRoot, 'src/styles/figma.variables.report.json');
const outputMapFile = path.resolve(projectRoot, 'src/styles/tokens.map.json');

function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function ensureEnv(name) {
  const v = process.env[name];
  if (!v) {
    process.exit(1);
  }
  return v;
}

async function fetchFigmaVariables({ token, fileKey }) {
  const resp = await fetch(`https://api.figma.com/v1/files/${fileKey}/variables/local`, {
    headers: {
      'X-Figma-Token': token,
    },
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Figma API error ${resp.status}: ${text}`);
  }
  return resp.json();
}

function flattenVariables(json) {
  // Structure reference: variables, collections, modes
  const { variables = {}, variableCollections = {}, modes = {} } = json;
  const byId = variables;

  // Build name → {id, valuesByMode, type}
  const result = {};
  Object.values(byId).forEach((v) => {
    const entry = {
      id: v.id,
      name: v.name, // e.g. "g-color/on-surface/1"
      type: v.resolvedType || v.type, // COLOR, FLOAT, STRING
      valuesByMode: {},
    };
    for (const [modeId, val] of Object.entries(v.valuesByMode || {})) {
      entry.valuesByMode[modeId] = val;
    }
    result[v.name] = entry;
  });
  return {
    variablesByName: result,
    modes,
    variableCollections,
  };
}

function pickModeIdByName(modes, preferredModeName) {
  // modes is a map: id -> {name}
  const entries = Object.entries(modes || {});
  if (!entries.length) return null;
  if (!preferredModeName) return entries[0][0];
  const found = entries.find(([, v]) => (v?.name || '').toLowerCase() === preferredModeName.toLowerCase());
  return found ? found[0] : entries[0][0];
}

function resolveColorValue(value) {
  // Figma returns { r,g,b,a } 0..1
  if (!value || typeof value !== 'object' || value.r === undefined) return null;
  const r = Math.round((value.r || 0) * 255);
  const g = Math.round((value.g || 0) * 255);
  const b = Math.round((value.b || 0) * 255);
  const a = value.a === undefined ? 1 : value.a;
  if (a >= 1) {
    return `rgb(${r}, ${g}, ${b})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${+a.toFixed(3)})`;
}

function coerceValue(type, val) {
  if (type === 'COLOR') return resolveColorValue(val) || null;
  if (type === 'FLOAT') return typeof val === 'number' ? String(val) : null;
  if (type === 'STRING') return typeof val === 'string' ? val : null;
  return null;
}

function buildTokenMap({ variablesByName, modes }, preferredModeName, aliases) {
  const modeId = pickModeIdByName(modes, preferredModeName);
  const out = {};
  // Try direct alias mapping first
  Object.entries(aliases || {}).forEach(([projectCssVar, figmaMatch]) => {
    // figmaMatch can be:
    // - exact variable name
    // - regex string e.g. "/on-surface\\/2$/"
    let matchName = null;
    if (figmaMatch?.startsWith?.('/') && figmaMatch.endsWith('/')) {
      const re = new RegExp(figmaMatch.slice(1, -1), 'i');
      matchName =
        Object.keys(variablesByName).find((n) => re.test(n)) || null;
    } else {
      matchName = variablesByName[figmaMatch] ? figmaMatch : null;
    }
    if (!matchName) return;
    const v = variablesByName[matchName];
    const raw = v?.valuesByMode?.[modeId];
    const coerced = coerceValue(v?.type, raw);
    if (coerced) out[projectCssVar] = coerced;
  });
  return out;
}

async function main() {
  const cfg = readJson(cfgFile, {});
  const token = process.env.FIGMA_TOKEN || cfg.figmaToken;
  const fileKey = process.env.FIGMA_FILE_KEY || cfg.fileKey;
  const preferredMode = process.env.FIGMA_MODE || cfg.mode || 'Default';
  if (!token || !fileKey) {
    process.exit(1);
  }
  const aliases = readJson(aliasesFile, {});

  const raw = await fetchFigmaVariables({ token, fileKey });
  const flat = flattenVariables(raw);
  fs.writeFileSync(reportFile, JSON.stringify(flat, null, 2), 'utf8');
  const mapped = buildTokenMap(flat, preferredMode, aliases);
  if (!Object.keys(mapped).length) {
  } else {
    // Merge with existing map to preserve unspecified tokens
    const existing = readJson(outputMapFile, {});
    const merged = { ...existing, ...mapped };
    fs.writeFileSync(outputMapFile, JSON.stringify(merged, null, 2), 'utf8');
  }
}

main().catch((err) => {
  process.exit(1);
});


