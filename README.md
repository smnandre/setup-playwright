<div align="center">
<a href="https://github.com/playwright-php"><img src="https://github.com/playwright-php/.github/raw/main/profile/playwright-php.png" alt="Playwright PHP" /></a>

&nbsp; ![CI](https://img.shields.io/github/actions/workflow/status/playwright-php/setup-playwright/test.yml?branch=main&label=Tests&color=1D8D23&labelColor=09161E&logoColor=FFFFFF)
&nbsp; ![Release](https://img.shields.io/github/v/release/playwright-php/setup-playwright?label=Stable&labelColor=09161E&color=1D8D23&logoColor=FFFFFF)
&nbsp; ![License](https://img.shields.io/github/license/playwright-php/setup-playwright?label=License&labelColor=09161E&color=1D8D23&logoColor=FFFFFF)

</div>

# Playwright PHP Setup Action

Install the Playwright npm package and browser binaries for a
[Playwright PHP](https://playwright-php.dev) GitHub Actions workflow.

This action does not install PHP, Composer dependencies, or Playwright PHP.
Configure those separately in your workflow.

Select the browser targets required by each workflow job. Omitting `browsers`
currently falls back to Google Chrome for backward compatibility, but that
behavior is deprecated.

## Quick start

```yaml
# .github/workflows/test.yml
name: PHP Tests

on:
  push:
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.4'

      - uses: playwright-php/setup-playwright@v1
        with:
          playwright-version: '1.58.2'
          browsers: chromium

      - run: composer install
      - run: vendor/bin/phpunit
```

Pin `playwright-version` to the version expected by Playwright PHP so CI does
not change when Playwright publishes a new release.

## Examples

### Install selected browsers

Install Playwright's managed Chromium browser:

```yaml
- uses: playwright-php/setup-playwright@v1
  with:
    browsers: chromium
```

Install several browser targets with a JSON array:

```yaml
- uses: playwright-php/setup-playwright@v1
  with:
    browsers: '["chromium","firefox"]'
```

`chromium` installs Playwright's managed Chromium build. `chrome` installs
Google Chrome in the operating system's global location and should be selected
explicitly:

```yaml
- uses: playwright-php/setup-playwright@v1
  with:
    browsers: chrome
```

Playwright warns that installing branded Chrome or Edge can replace an existing
operating-system installation. The action does not treat `chrome` as an alias
for `chromium`, and it does not accept `safari` as an alias for `webkit`.

### Reuse cached browser downloads

```yaml
- name: Choose Playwright version
  run: echo "PLAYWRIGHT_VERSION=1.58.2" >> "$GITHUB_ENV"

- uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ env.PLAYWRIGHT_VERSION }}-chromium

- uses: playwright-php/setup-playwright@v1
  with:
    playwright-version: ${{ env.PLAYWRIGHT_VERSION }}
    browsers: chromium
    browsers-path: ~/.cache/ms-playwright
```

Include the runner OS, Playwright version, and browser selection in the cache
key. Browser binaries are tied to their Playwright release.

### Use the action outputs

```yaml
- id: playwright
  uses: playwright-php/setup-playwright@v1
  with:
    playwright-version: '1.58.2'
    browsers: '["chromium","firefox"]'

- name: Show installed runtime
  run: |
    echo "Playwright ${{ steps.playwright.outputs.playwright-version }}"
    echo '${{ steps.playwright.outputs.installed-browsers }}'
```

### Control operating-system dependencies

```yaml
- uses: playwright-php/setup-playwright@v1
  with:
    browsers: webkit
    with-deps: false
```

`with-deps: auto` installs browser system dependencies on Linux and skips that
step on macOS and Windows. Use `true` or `false` to override this behavior.

## Outputs

The action exposes two outputs:

- `playwright-version`: the installed Playwright CLI version
- `installed-browsers`: a JSON list of the browsers that were installed

## Configuration

| Option | Default | Allowed values | Notes |
| --- | --- | --- | --- |
| `browsers` | `chrome` when omitted, deprecated | `all`, `chromium`, `firefox`, `webkit`, `chrome`, `chrome-beta`, `msedge`, `msedge-beta` | Set this explicitly. `all` installs Playwright's default managed browser set. Use a JSON array for several targets. |
| `playwright-version` | `latest` | Any valid npm specifier for `playwright` | Pin an exact version for reproducible CI. Use `latest` only when intentionally testing new upstream releases. |
| `with-deps` | `auto` | `true`, `false`, `auto` | `auto` appends Playwright's `--with-deps` flag on Linux runners. |
| `browsers-path` | | Directory path | Exports `PLAYWRIGHT_BROWSERS_PATH` for managed browser downloads. It does not relocate branded Chrome or Edge. |

## Action version

Reference `playwright-php/setup-playwright@v1` to receive backward-compatible
fixes within the current major version. Pin a complete tag such as `@v1.1.0`
when the workflow must use an immutable action revision.

For backward compatibility, version 1 installs Google Chrome when `browsers` is
omitted and emits a deprecation warning. Set `browsers` explicitly now;
omitting it will fail in version 2.

The action version and the `playwright-version` input are independent: the
first selects the action code, the second selects the npm package and browser
binaries the action installs.

## Contributing

The action is validated by `.github/workflows/test.yml` on Linux, macOS, and
Windows. Trigger that workflow with `workflow_dispatch`, or run it with
[`act`](https://github.com/nektos/act) for a local Linux check.

Run the browser-input contract tests locally with `node --test tests/*.test.cjs`.

## License

This package is released by the [Playwright PHP](https://playwright-php.dev)
project under the MIT License. See the [LICENSE](LICENSE) file for details.
