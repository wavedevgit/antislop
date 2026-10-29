# Getting started

Requires Node.js 22.12 or newer.

## Install the agent skill

```bash
npx skills add wavedevgit/antislop --skill antislop-design
```

## Find a browser

```bash
npx --yes --package=github:wavedevgit/antislop antislop --find-browser
```

## Scan a page

```bash
npx --yes --package=github:wavedevgit/antislop antislop \
  --browser /path/to/chromium \
  --url http://localhost:3000
```

## Scan source files

```bash
npx --yes --package=github:wavedevgit/antislop antislop \
  --folder ./path/to/site
```

<div class="markdown-alert markdown-alert-warning">
  <p class="markdown-alert-title"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6.46 1.755a1.75 1.75 0 0 1 3.08 0l6.082 11.5A1.75 1.75 0 0 1 14.082 16H1.918a1.75 1.75 0 0 1-1.54-2.745ZM8 3.5a.25.25 0 0 0-.22.133L1.698 15.134a.25.25 0 0 0 .22.366h12.164a.25.25 0 0 0 .22-.366L8.22 3.633A.25.25 0 0 0 8 3.5M7.25 9V6h1.5v3Zm0 2.5V10h1.5v1.5Z" /></svg>Warning</p>
  <p><strong>Browser scans are recommended.</strong> File scans cannot reliably resolve computed styles, rendered layout, or responsive behavior. Browser scans run against the page a visitor actually sees and return the element, the rule, and the reason.</p>
</div>

Both modes share the same rule IDs and exit behavior. Unknown rule IDs fail instead of being ignored. See the [CLI reference](cli.md) for every option, default, and exit status.
