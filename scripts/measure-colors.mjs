#!/usr/bin/env node

import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const DEFAULT_TOKEN_FILE = path.join("frontend", "design-tokens", "src", "tokens.css");
const DEFAULT_TARGETS = ["frontend", "sites"];
const MAX_SAMPLES_PER_ENTRY = 5;
const ALLOWED_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".mts",
  ".cts",
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".pcss",
  ".html",
  ".htm",
  ".md",
  ".mdx",
  ".astro",
  ".vue",
]);
const SKIP_DIR_NAMES = new Set([
  "node_modules",
  "dist",
  "build",
  ".vite",
  ".git",
  ".turbo",
  ".next",
  ".output",
  ".expo",
  ".cache",
  ".parcel-cache",
  "coverage",
  ".idea",
  ".vscode",
  "target",
]);

const HEX_COLOR_REGEX = /#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/gi;
const COLOR_FUNCTION_REGEX = /\b(?:oklch|oklab|rgba?|hsla?|hwb|lab|lch|color)\([^)]*\)/gi;
const CSS_VAR_REGEX = /var\(\s*(--[a-z0-9-_]+)/gi;
const COLORISH_VAR_NAME_REGEX =
  /^--(?:(?:color-)?(?:background|foreground|card(?:-foreground)?|popover(?:-foreground)?|primary(?:-foreground)?|secondary(?:-foreground)?|accent(?:-foreground)?|muted(?:-foreground)?|destructive(?:-[a-z0-9-]+)?|border|line(?:-[a-z0-9-]+)?|input|ring|chart-\d+|surface(?:-[a-z0-9-]+)?|body(?:-[a-z0-9-]+)?|selection(?:-[a-z0-9-]+)?|brand(?:-[a-z0-9-]+)?|fg(?:-[a-z0-9-]+)?|success(?:-[a-z0-9-]+)?|warning(?:-[a-z0-9-]+)?))/;
const COLORISH_TAILWIND_NAME_REGEX =
  /^(?:color-)?(?:background|foreground|card(?:-foreground)?|popover(?:-foreground)?|primary(?:-foreground)?|secondary(?:-foreground)?|accent(?:-foreground)?|muted(?:-foreground)?|destructive(?:-[a-z0-9-]+)?|border|line(?:-[a-z0-9-]+)?|input|ring|chart-\d+|surface(?:-[a-z0-9-]+)?|body(?:-[a-z0-9-]+)?|selection(?:-[a-z0-9-]+)?|brand(?:-[a-z0-9-]+)?|fg(?:-[a-z0-9-]+)?|success(?:-[a-z0-9-]+)?|warning(?:-[a-z0-9-]+)?)/;
const COLOR_VALUE_HINT_REGEX = /(oklch|oklab|rgba?|hsla?|hwb|lab|lch|color)\s*\(|#[0-9a-f]{3,8}/i;
const TAILWIND_CLASS_REGEX =
  /(?:^|[\s"'`=([{,>])((?:[a-z0-9-]+:)*(?:bg|text|border|ring|outline|fill|stroke|caret|shadow|accent|decoration|from|via|to)-[^\s"'`=)}>,;]+)/g;
const TAILWIND_PALETTE_BASES = new Set([
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "black",
  "white",
  "transparent",
  "current",
  "inherit",
]);
const ARBITRARY_COLOR_VALUE_REGEX =
  /^\s*(?:#(?:[0-9a-f]{3,8})|(?:oklch|oklab|rgba?|hsla?|hwb|lab|lch|color)\([^)]*\)|var\(--[a-z0-9-_]+\)|[a-z]+(?:-[a-z0-9]+)*)\s*$/i;
const MAX_FILE_SIZE_BYTES = 1_000_000;

const prefixMap = {
  "--": "--",
  "--color-": "--color-",
};

const usageState = {
  cssVarUsage: new Map(),
  tailwindTokenUsage: new Map(),
  tailwindPaletteUsage: new Map(),
  tailwindArbitraryUsage: new Map(),
  literalColors: new Map(),
  colorFunctions: new Map(),
};

let knownCanonicalTokens = new Set();

const stats = {
  filesVisited: 0,
  filesAnalyzed: 0,
  bytesRead: 0,
};

async function main() {
  const config = parseArgs(process.argv.slice(2));
  if (config.help) {
    printUsage();
    return;
  }

  const tokensFile = resolveUnderRepo(config.tokensFile ?? DEFAULT_TOKEN_FILE);
  const targetPaths =
    config.targets.length > 0 ? config.targets.map((input) => resolveUnderRepo(input)) : DEFAULT_TARGETS.map((target) => resolveUnderRepo(target));

  const { tokenDefinitions, tokensByCanonical } = await loadTokenDefinitions(tokensFile);
  knownCanonicalTokens = new Set(tokensByCanonical.keys());

  await scanTargets(targetPaths, tokensFile);

  const aggregate = buildTokenAggregates(tokensByCanonical, usageState.cssVarUsage, usageState.tailwindTokenUsage);
  const unusedTokens = computeUnusedTokens(tokenDefinitions, aggregate);
  const undefinedReferences = computeUndefinedReferences(aggregate);

  printReport({
    config,
    tokensFile,
    targetPaths,
    tokenDefinitions,
    aggregate,
    unusedTokens,
    undefinedReferences,
  });
}

function parseArgs(argv) {
  const config = {
    help: false,
    tokensFile: undefined,
    targets: [],
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      config.help = true;
      return config;
    }
    if (arg === "--tokens") {
      const next = argv[i + 1];
      if (!next) {
        throw new Error("--tokens にはファイルパスが必要です。");
      }
      config.tokensFile = next;
      i += 1;
      continue;
    }
    if (arg.startsWith("--")) {
      throw new Error(`未知のオプションです: ${arg}`);
    }
    config.targets.push(arg);
  }

  return config;
}

function printUsage() {
  console.log(
    [
      "Usage: node scripts/measure-colors.mjs [options] [paths...]",
      "",
      "Options:",
      "  --tokens <path>   デザイントークンの CSS ファイルを指定します（既定: frontend/design-tokens/src/tokens.css）",
      "  -h, --help        このヘルプを表示します",
      "",
      "paths を省略した場合は frontend と sites を走査します。",
    ].join("\n"),
  );
}

function resolveUnderRepo(targetPath) {
  if (path.isAbsolute(targetPath)) {
    return targetPath;
  }
  return path.resolve(repoRoot, targetPath);
}

async function loadTokenDefinitions(tokenFile) {
  const definitions = new Map();
  const tokensByCanonical = new Map();

  try {
    const raw = await fs.readFile(tokenFile, "utf8");
    const definitionRegex = /(--[a-z0-9-_]+)\s*:\s*([^;]+);/gi;

    for (const match of raw.matchAll(definitionRegex)) {
      const name = match[1].toLowerCase();
      const value = match[2].trim();
      if (!isColorToken(name, value)) {
        continue;
      }

      definitions.set(name, { name, value });
      const canonical = canonicalizeTokenName(name);
      if (!tokensByCanonical.has(canonical)) {
        tokensByCanonical.set(canonical, []);
      }
      tokensByCanonical.get(canonical)?.push({ name, value });
    }
  } catch (error) {
    console.warn(`トークンファイルを読み込めませんでした: ${tokenFile}`);
    throw error;
  }

  return { tokenDefinitions: definitions, tokensByCanonical };
}

function isColorToken(name, value) {
  if (name.startsWith(prefixMap["--color-"])) {
    return true;
  }
  return COLOR_VALUE_HINT_REGEX.test(value);
}

async function scanTargets(targetPaths, tokensFile) {
  const queue = [...targetPaths];
  while (queue.length > 0) {
    const currentPath = queue.shift();
    if (!currentPath) {
      continue;
    }

    let stat;
    try {
      stat = await fs.stat(currentPath);
    } catch {
      console.warn(`存在しないパスをスキップ: ${path.relative(repoRoot, currentPath)}`);
      continue;
    }

    if (stat.isDirectory()) {
      stats.filesVisited += 1;
      const dirEntries = await fs.readdir(currentPath, { withFileTypes: true });
      for (const entry of dirEntries) {
        if (entry.isDirectory()) {
          if (SKIP_DIR_NAMES.has(entry.name)) {
            continue;
          }
        }
        const nextPath = path.join(currentPath, entry.name);
        if (entry.isDirectory()) {
          queue.push(nextPath);
        } else if (entry.isFile()) {
          queue.push(nextPath);
        }
      }
    } else if (stat.isFile()) {
      if (currentPath === tokensFile) {
        continue;
      }
      const ext = path.extname(currentPath).toLowerCase();
      if (!ALLOWED_EXTENSIONS.has(ext)) {
        continue;
      }
      if (stat.size > MAX_FILE_SIZE_BYTES) {
        continue;
      }
      await analyzeFile(currentPath);
    }
  }
}

async function analyzeFile(filePath) {
  let raw;
  try {
    raw = await fs.readFile(filePath, "utf8");
  } catch (error) {
    console.warn(`ファイルを読み込めませんでした: ${filePath}`, error.message);
    return;
  }

  stats.filesAnalyzed += 1;
  stats.bytesRead += Buffer.byteLength(raw, "utf8");

  const relativePath = path.relative(repoRoot, filePath).split(path.sep).join("/");
  const lines = raw.split(/\r?\n/);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const lineText = lines[lineIndex];
    const lineNumber = lineIndex + 1;

    recordCssVariableMatches(lineText, relativePath, lineNumber);
    recordHexMatches(lineText, relativePath, lineNumber);
    recordColorFunctionMatches(lineText, relativePath, lineNumber);
    recordTailwindMatches(lineText, relativePath, lineNumber);
  }
}

function recordCssVariableMatches(lineText, relativePath, lineNumber) {
  CSS_VAR_REGEX.lastIndex = 0;
  for (const match of lineText.matchAll(CSS_VAR_REGEX)) {
    const rawName = match[1]?.toLowerCase();
    if (!rawName || !COLORISH_VAR_NAME_REGEX.test(rawName)) {
      continue;
    }
    recordUsage(usageState.cssVarUsage, rawName, relativePath, lineNumber, match[0]);
  }
}

function recordHexMatches(lineText, relativePath, lineNumber) {
  HEX_COLOR_REGEX.lastIndex = 0;
  for (const match of lineText.matchAll(HEX_COLOR_REGEX)) {
    const normalized = match[0]?.toUpperCase();
    if (!normalized) {
      continue;
    }
    recordUsage(usageState.literalColors, normalized, relativePath, lineNumber, normalized);
  }
}

function recordColorFunctionMatches(lineText, relativePath, lineNumber) {
  COLOR_FUNCTION_REGEX.lastIndex = 0;
  for (const match of lineText.matchAll(COLOR_FUNCTION_REGEX)) {
    const normalized = normalizeColorFunction(match[0]);
    if (!normalized) {
      continue;
    }
    recordUsage(usageState.colorFunctions, normalized, relativePath, lineNumber, normalized);
  }
}

function normalizeColorFunction(value) {
  const trimmed = value.trim();
  const fnMatch = trimmed.match(/^([a-z-]+)\((.*)\)$/i);
  if (!fnMatch) {
    return trimmed;
  }
  const fnName = fnMatch[1]?.toLowerCase() ?? "";
  const body = fnMatch[2]?.trim().replace(/\s+/g, " ") ?? "";
  return `${fnName}(${body})`;
}

function recordTailwindMatches(lineText, relativePath, lineNumber) {
  TAILWIND_CLASS_REGEX.lastIndex = 0;
  for (const match of lineText.matchAll(TAILWIND_CLASS_REGEX)) {
    const rawClass = match[1];
    if (!rawClass) {
      continue;
    }
    const baseToken = rawClass.split(":").pop();
    if (!baseToken) {
      continue;
    }
    const normalizedBase = baseToken.startsWith("!") ? baseToken.slice(1) : baseToken;
    const hyphenIndex = normalizedBase.indexOf("-");
    if (hyphenIndex === -1) {
      continue;
    }
    const prefix = normalizedBase.slice(0, hyphenIndex);
    const remainder = normalizedBase.slice(hyphenIndex + 1);
    if (!remainder) {
      continue;
    }

    const { colorKey, opacity } = splitOpacity(remainder);
    if (!colorKey) {
      continue;
    }

    if (colorKey.startsWith("[") && colorKey.endsWith("]")) {
      const innerValue = colorKey.slice(1, -1);
      if (ARBITRARY_COLOR_VALUE_REGEX.test(innerValue)) {
        recordUsage(
          usageState.tailwindArbitraryUsage,
          `${prefix}-[${innerValue}]${opacity ? `/${opacity}` : ""}`,
          relativePath,
          lineNumber,
          normalizedBase,
          { value: innerValue },
        );
        const varMatches = innerValue.match(/var\(\s*(--[a-z0-9-_]+)/gi) ?? [];
        for (const varMatch of varMatches) {
          const innerName = varMatch.match(/--[a-z0-9-_]+/i)?.[0]?.toLowerCase();
          if (innerName && COLORISH_VAR_NAME_REGEX.test(innerName)) {
            recordUsage(usageState.cssVarUsage, innerName, relativePath, lineNumber, varMatch);
          }
        }
      }
      continue;
    }

    const canonicalKey = colorKey.toLowerCase();
    if (knownCanonicalTokens.has(canonicalKey) || COLORISH_TAILWIND_NAME_REGEX.test(canonicalKey)) {
      recordUsage(
        usageState.tailwindTokenUsage,
        canonicalKey,
        relativePath,
        lineNumber,
        normalizedBase,
        { className: `${prefix}-${colorKey}${opacity ? `/${opacity}` : ""}` },
      );
      continue;
    }

    const paletteMatch = colorKey.match(/^([a-z]+)(?:-(\d{1,3}))?$/i);
    if (paletteMatch) {
      const paletteKey = paletteMatch[1]?.toLowerCase();
      if (paletteKey && TAILWIND_PALETTE_BASES.has(paletteKey)) {
        recordUsage(
          usageState.tailwindPaletteUsage,
          `${prefix}-${colorKey}${opacity ? `/${opacity}` : ""}`,
          relativePath,
          lineNumber,
          normalizedBase,
        );
        continue;
      }
    }
  }
}

function splitOpacity(remainder) {
  if (remainder.startsWith("[")) {
    const closingIndex = remainder.lastIndexOf("]");
    if (closingIndex !== -1 && closingIndex < remainder.length - 1 && remainder[closingIndex + 1] === "/") {
      return {
        colorKey: remainder.slice(0, closingIndex + 1),
        opacity: remainder.slice(closingIndex + 2),
      };
    }
    return { colorKey: remainder, opacity: "" };
  }

  const slashIndex = remainder.indexOf("/");
  if (slashIndex === -1) {
    return { colorKey: remainder, opacity: "" };
  }
  return {
    colorKey: remainder.slice(0, slashIndex),
    opacity: remainder.slice(slashIndex + 1),
  };
}

function recordUsage(map, key, file, line, snippet, detail) {
  const entry = map.get(key) ?? { count: 0, occurrences: [] };
  entry.count += 1;
  if (entry.occurrences.length < MAX_SAMPLES_PER_ENTRY) {
    entry.occurrences.push({
      file,
      line,
      snippet: truncateSnippet(snippet),
      detail,
    });
  }
  map.set(key, entry);
}

function truncateSnippet(text) {
  if (!text) {
    return "";
  }
  const trimmed = text.trim();
  return trimmed.length > 120 ? `${trimmed.slice(0, 117)}...` : trimmed;
}

function canonicalizeTokenName(name) {
  let canonical = name.toLowerCase();
  canonical = canonical.replace(/^--/, "");
  canonical = canonical.replace(/^color-/, "");
  return canonical;
}

function buildTokenAggregates(tokensByCanonical, cssVarUsage, tailwindTokenUsage) {
  const aggregate = new Map();

  for (const [canonical, entries] of tokensByCanonical) {
    aggregate.set(canonical, {
      canonical,
      tokens: entries,
      cssVar: { count: 0, occurrences: [] },
      tailwind: { count: 0, occurrences: [] },
    });
  }

  for (const [tokenName, usage] of cssVarUsage) {
    const canonical = canonicalizeTokenName(tokenName);
    if (!aggregate.has(canonical)) {
      aggregate.set(canonical, {
        canonical,
        tokens: [],
        cssVar: { count: 0, occurrences: [] },
        tailwind: { count: 0, occurrences: [] },
      });
    }
    const entry = aggregate.get(canonical);
    mergeUsage(entry.cssVar, usage, (occurrence) => ({
      ...occurrence,
      detail: { ...(occurrence.detail ?? {}), token: tokenName },
    }));
  }

  for (const [canonical, usage] of tailwindTokenUsage) {
    if (!aggregate.has(canonical)) {
      aggregate.set(canonical, {
        canonical,
        tokens: [],
        cssVar: { count: 0, occurrences: [] },
        tailwind: { count: 0, occurrences: [] },
      });
    }
    const entry = aggregate.get(canonical);
    mergeUsage(entry.tailwind, usage);
  }

  return aggregate;
}

function mergeUsage(target, usage, occurrenceMapper) {
  target.count += usage.count;
  if (target.occurrences.length >= MAX_SAMPLES_PER_ENTRY) {
    return;
  }
  for (const occurrence of usage.occurrences) {
    const mapped = occurrenceMapper ? occurrenceMapper(occurrence) : occurrence;
    target.occurrences.push(mapped);
    if (target.occurrences.length >= MAX_SAMPLES_PER_ENTRY) {
      break;
    }
  }
}

function computeUnusedTokens(tokenDefinitions, aggregate) {
  const unused = [];
  for (const tokenName of tokenDefinitions.keys()) {
    const canonical = canonicalizeTokenName(tokenName);
    const entry = aggregate.get(canonical);
    const cssCount = entry?.cssVar.count ?? 0;
    const twCount = entry?.tailwind.count ?? 0;
    if (cssCount === 0 && twCount === 0) {
      unused.push(tokenName);
    }
  }
  return unused.sort();
}

function computeUndefinedReferences(aggregate) {
  const items = [];
  for (const entry of aggregate.values()) {
    if (entry.tokens.length > 0) {
      continue;
    }
    const total = entry.cssVar.count + entry.tailwind.count;
    if (total === 0) {
      continue;
    }
    items.push(entry);
  }
  return items;
}

function summarizeUsageMap(map) {
  return [...map.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .map(([key, data]) => ({
      key,
      count: data.count,
      occurrences: data.occurrences,
    }));
}

function printReport({ config, tokensFile, targetPaths, tokenDefinitions, aggregate, unusedTokens, undefinedReferences }) {
  console.log("色使用状況レポート");
  console.log("========================================");
  console.log(`ターゲット: ${targetPaths.map((target) => path.relative(repoRoot, target)).join(", ")}`);
  console.log(`トークン定義: ${path.relative(repoRoot, tokensFile)}`);
  console.log(`解析ファイル数: ${stats.filesAnalyzed}`);
  console.log(`総読み込み量: ${(stats.bytesRead / 1024).toFixed(1)} KB`);
  console.log("");

  printTokenSection(aggregate);
  printUndefinedReferenceSection(undefinedReferences);
  printUnusedTokenSection(unusedTokens);
  printLiteralColorSection("直接指定された 16 進数カラー", usageState.literalColors);
  printLiteralColorSection("直接指定されたカラーファンクション", usageState.colorFunctions);
  printUsageList("Tailwind 既定パレットの利用状況", summarizeUsageMap(usageState.tailwindPaletteUsage));
  printUsageList("Tailwind の任意色ユーティリティ", summarizeUsageMap(usageState.tailwindArbitraryUsage));
}

function printTokenSection(aggregate) {
  const entries = [...aggregate.values()]
    .filter((entry) => entry.cssVar.count + entry.tailwind.count > 0 && entry.tokens.length > 0)
    .sort((a, b) => b.cssVar.count + b.tailwind.count - (a.cssVar.count + a.tailwind.count));

  if (entries.length === 0) {
    console.log("色トークンの使用は検出されませんでした。");
    console.log("");
    return;
  }

  console.log("デザイントークンの利用状況");
  for (const entry of entries) {
    const total = entry.cssVar.count + entry.tailwind.count;
    const tokenList = entry.tokens.map((token) => token.name).join(", ");
    console.log(`- ${entry.canonical} (${tokenList}) -> 合計 ${total} (var: ${entry.cssVar.count}, tailwind: ${entry.tailwind.count})`);
    printOccurrenceSamples(entry.cssVar.occurrences, "  var");
    printOccurrenceSamples(entry.tailwind.occurrences, "  tailwind");
  }
  console.log("");
}

function printUndefinedReferenceSection(undefinedReferences) {
  if (undefinedReferences.length === 0) {
    return;
  }
  console.log("トークン未定義の参照");
  for (const entry of undefinedReferences) {
    const total = entry.cssVar.count + entry.tailwind.count;
    console.log(`- ${entry.canonical} -> 合計 ${total} (var: ${entry.cssVar.count}, tailwind: ${entry.tailwind.count})`);
    printOccurrenceSamples(entry.cssVar.occurrences, "  var");
    printOccurrenceSamples(entry.tailwind.occurrences, "  tailwind");
  }
  console.log("");
}

function printUnusedTokenSection(unusedTokens) {
  if (unusedTokens.length === 0) {
    return;
  }
  console.log("未使用トークン");
  for (const token of unusedTokens) {
    console.log(`- ${token}`);
  }
  console.log("");
}

function printLiteralColorSection(title, map) {
  const entries = summarizeUsageMap(map);
  if (entries.length === 0) {
    return;
  }
  console.log(title);
  for (const entry of entries) {
    console.log(`- ${entry.key}: ${entry.count}`);
    printOccurrenceSamples(entry.occurrences, "  ");
  }
  console.log("");
}

function printUsageList(title, entries) {
  if (entries.length === 0) {
    return;
  }
  console.log(title);
  for (const entry of entries) {
    console.log(`- ${entry.key}: ${entry.count}`);
    printOccurrenceSamples(entry.occurrences, "  ");
  }
  console.log("");
}

function printOccurrenceSamples(occurrences, prefix) {
  if (!occurrences || occurrences.length === 0) {
    return;
  }
  for (const occurrence of occurrences) {
    const detailParts = [];
    if (occurrence.detail?.token) {
      detailParts.push(occurrence.detail.token);
    }
    if (occurrence.detail?.className) {
      detailParts.push(occurrence.detail.className);
    }
    if (occurrence.detail?.value) {
      detailParts.push(occurrence.detail.value);
    }
    const detailText = detailParts.length > 0 ? ` (${detailParts.join(" | ")})` : "";
    console.log(`${prefix}• ${occurrence.file}:${occurrence.line} -> ${occurrence.snippet}${detailText}`);
  }
}

main().catch((error) => {
  console.error("色測定スクリプトでエラーが発生しました。", error);
  process.exitCode = 1;
});
