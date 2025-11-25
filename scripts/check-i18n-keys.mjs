#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const locales = ['en', 'ja'];

const workspaceConfigs = [
  {
    name: '@decopon/core',
    localeDir: 'frontend/core/src/scripts/i18n/locales',
  },
  {
    name: '@decopon/sites',
    localeDir: 'sites/src/i18n/locales',
  },
];

const scriptDir = fileURLToPath(new URL('.', import.meta.url));
const repositoryRoot = resolve(scriptDir, '..');

const localeAggregation = {
  en: { keys: new Set(), origins: new Map() },
  ja: { keys: new Set(), origins: new Map() },
};

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function collectLeafKeys(value, prefix = '') {
  if (!isRecord(value)) {
    return prefix ? [prefix] : [];
  }

  const entries = Object.entries(value);

  if (entries.length === 0) {
    return prefix ? [prefix] : [];
  }

  return entries.flatMap(([key, child]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;

    if (isRecord(child)) {
      return collectLeafKeys(child, nextPrefix);
    }

    if (Array.isArray(child)) {
      if (child.length === 0) {
        return [nextPrefix];
      }

      return child.flatMap((item, index) => collectLeafKeys(item, `${nextPrefix}[${index}]`));
    }

    return [nextPrefix];
  });
}

async function readLocaleFile(path) {
  const content = await readFile(path, 'utf8');

  try {
    const parsed = JSON.parse(content);

    if (!isRecord(parsed)) {
      throw new Error('locale file must contain a JSON object at its root');
    }

    return parsed;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Failed to parse JSON file: ${path}\n${error.message}`);
    }

    throw error;
  }
}

function registerKey(locale, key, source) {
  const aggregation = localeAggregation[locale];

  aggregation.keys.add(key);

  const originSet = aggregation.origins.get(key) ?? new Set();
  originSet.add(source);
  aggregation.origins.set(key, originSet);
}

async function aggregateWorkspaceLocales() {
  for (const workspace of workspaceConfigs) {
    for (const locale of locales) {
      const filePath = resolve(repositoryRoot, workspace.localeDir, `${locale}.json`);
      const relativePath = relative(repositoryRoot, filePath);

      let localeData;

      try {
        localeData = await readLocaleFile(filePath);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to read ${workspace.name} ${locale} locale: ${message}`);
      }

      const keys = collectLeafKeys(localeData);

      keys.forEach((key) => {
        registerKey(locale, key, `${workspace.name}:${relativePath}`);
      });
    }
  }
}

function difference(base, comparator) {
  return Array.from(base).filter((key) => !comparator.has(key)).sort();
}

function formatOrigins(origins, key) {
  const originSet = origins.get(key);

  if (!originSet) {
    return '(unknown source)';
  }

  return Array.from(originSet).sort().join(', ');
}

async function main() {
  await aggregateWorkspaceLocales();

  const missingInJa = difference(localeAggregation.en.keys, localeAggregation.ja.keys);
  const missingInEn = difference(localeAggregation.ja.keys, localeAggregation.en.keys);

  if (missingInJa.length === 0 && missingInEn.length === 0) {
    console.log('All locale keys are aligned between en and ja across @decopon/core and @decopon/sites.');
    return;
  }

  console.error('Locale key mismatch detected.');

  if (missingInJa.length > 0) {
    console.error('\nKeys missing from ja locales:');
    missingInJa.forEach((key) => {
      const origin = formatOrigins(localeAggregation.en.origins, key);
      console.error(`  - ${key} (defined in: ${origin})`);
    });
  }

  if (missingInEn.length > 0) {
    console.error('\nKeys missing from en locales:');
    missingInEn.forEach((key) => {
      const origin = formatOrigins(localeAggregation.ja.origins, key);
      console.error(`  - ${key} (defined in: ${origin})`);
    });
  }

  process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
