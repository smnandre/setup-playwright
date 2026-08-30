const fs = require('node:fs');

const DEFAULT_BROWSERS = Object.freeze(['chromium', 'firefox', 'webkit']);
const LEGACY_DEFAULT_BROWSER = 'chrome';
const ALLOWED_TARGETS = Object.freeze([
  ...DEFAULT_BROWSERS,
  'chrome',
  'chrome-beta',
  'msedge',
  'msedge-beta',
]);

function resolveBrowsers(input) {
  const supplied = input !== undefined && input !== null && String(input).trim() !== '';
  const raw = supplied ? String(input).trim() : LEGACY_DEFAULT_BROWSER;

  if (raw.toLowerCase() === 'all') {
    return {
      cli: '',
      browsers: [...DEFAULT_BROWSERS],
      usedLegacyDefault: false,
    };
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = raw;
  }

  let values;
  if (Array.isArray(parsed)) {
    values = parsed;
  } else if (typeof parsed === 'string') {
    values = [parsed];
  } else {
    throw new Error('Browsers must be "all", one browser name, or a JSON array of browser names.');
  }

  const targets = [];
  for (const value of values) {
    const target = String(value).trim().toLowerCase();
    if (target === '') {
      continue;
    }
    if (!ALLOWED_TARGETS.includes(target)) {
      throw new Error(`Invalid browser "${target}". Allowed: ${ALLOWED_TARGETS.join(', ')}, or "all".`);
    }
    if (!targets.includes(target)) {
      targets.push(target);
    }
  }

  if (targets.length === 0) {
    throw new Error('At least one browser must be specified.');
  }

  return {
    cli: targets.join(' '),
    browsers: targets,
    usedLegacyDefault: !supplied,
  };
}

function writeOutputs(outputPath, result) {
  fs.appendFileSync(
    outputPath,
    `cli=${result.cli}\njson=${JSON.stringify(result.browsers)}\n`,
  );
}

if (require.main === module) {
  try {
    if (!process.env.GITHUB_OUTPUT) {
      throw new Error('GITHUB_OUTPUT is required.');
    }
    const result = resolveBrowsers(process.env.INPUT_BROWSERS);
    if (result.usedLegacyDefault) {
      console.log(
        '::warning::Omitting the browsers input is deprecated and currently falls back to chrome. Set browsers explicitly; omission will fail in v2.',
      );
    }
    writeOutputs(process.env.GITHUB_OUTPUT, result);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

module.exports = {
  ALLOWED_TARGETS,
  DEFAULT_BROWSERS,
  LEGACY_DEFAULT_BROWSER,
  resolveBrowsers,
  writeOutputs,
};
