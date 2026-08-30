const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const {
  ALLOWED_TARGETS,
  DEFAULT_BROWSERS,
  LEGACY_DEFAULT_BROWSER,
  resolveBrowsers,
} = require('../scripts/resolve-browsers.cjs');

test('preserves the deprecated Chrome fallback when the input is omitted', () => {
  assert.deepEqual(resolveBrowsers(), {
    cli: 'chrome',
    browsers: ['chrome'],
    usedLegacyDefault: true,
  });
  assert.equal(LEGACY_DEFAULT_BROWSER, 'chrome');
});

test('warns when using the deprecated Chrome fallback', () => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-playwright-'));
  const outputPath = path.join(temporaryDirectory, 'output');

  try {
    const result = spawnSync(
      process.execPath,
      [path.join(__dirname, '../scripts/resolve-browsers.cjs')],
      {
        encoding: 'utf8',
        env: {
          ...process.env,
          GITHUB_OUTPUT: outputPath,
          INPUT_BROWSERS: '',
        },
      },
    );

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /::warning::Omitting the browsers input is deprecated/);
    assert.equal(fs.readFileSync(outputPath, 'utf8'), 'cli=chrome\njson=["chrome"]\n');
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true });
  }
});

test('resolves all to the default managed browser set without CLI targets', () => {
  assert.deepEqual(resolveBrowsers('all'), {
    cli: '',
    browsers: ['chromium', 'firefox', 'webkit'],
    usedLegacyDefault: false,
  });
  assert.deepEqual(DEFAULT_BROWSERS, ['chromium', 'firefox', 'webkit']);
});

test('resolves a single managed browser', () => {
  assert.deepEqual(resolveBrowsers('chromium'), {
    cli: 'chromium',
    browsers: ['chromium'],
    usedLegacyDefault: false,
  });
});

test('normalizes and deduplicates a JSON browser list', () => {
  assert.deepEqual(resolveBrowsers('["WebKit", "chromium", "webkit"]'), {
    cli: 'webkit chromium',
    browsers: ['webkit', 'chromium'],
    usedLegacyDefault: false,
  });
});

test('keeps branded browsers distinct from managed Chromium', () => {
  assert.deepEqual(resolveBrowsers('["chrome", "chrome-beta", "msedge", "msedge-beta"]'), {
    cli: 'chrome chrome-beta msedge msedge-beta',
    browsers: ['chrome', 'chrome-beta', 'msedge', 'msedge-beta'],
    usedLegacyDefault: false,
  });
});

test('rejects Safari instead of treating it as WebKit', () => {
  assert.throws(
    () => resolveBrowsers('safari'),
    new RegExp(`Allowed: ${ALLOWED_TARGETS.join(', ')}, or "all"`),
  );
});

test('rejects an empty browser list', () => {
  assert.throws(() => resolveBrowsers('[]'), /At least one browser must be specified/);
});

test('rejects all inside a browser list', () => {
  assert.throws(() => resolveBrowsers('["all"]'), /Invalid browser "all"/);
});
