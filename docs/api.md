# JavaScript API

The package exports the scanner primitives used by the CLI. Use the CLI for ordinary scans; use this API to run custom rules or integrate findings into another Node.js tool.

## Run a custom rule

```js
import { defineRule, detect, withContext } from 'antislop';

const missingLanguage = defineRule({
  id: 'require-document-language',
  title: 'Missing document language',
  description: 'The root HTML element should declare a language.',
  match(context) {
    if (context.type !== 'files') return { matches: false };

    const references = context.files.search(/<html(?![^>]*\blang=)[^>]*>/i);

    return references.length === 0
      ? { matches: false }
      : {
          matches: true,
          explanation: 'The HTML document does not declare a language.',
          references: references.map(({ path, content, index, match }) => {
            const before = content.slice(0, index);

            return {
              type: 'file',
              path,
              line: before.split('\n').length,
              column: index - before.lastIndexOf('\n'),
              source: match,
            };
          }),
        };
  },
});

const findings = await withContext(
  { type: 'files', folder: './site', disabledRuleIds: [] },
  (context) => detect([missingLanguage], context),
);

console.log(findings);
```

## Runtime exports

| Export | Purpose |
| --- | --- |
| `detect(rules, context)` | Run rules in order and return their findings. |
| `withContext(config, run)` | Open a file or Puppeteer context, run a callback, and clean up. |
| `defineRule(rule)` | Define a custom rule while preserving its shape. |
| `readFiles(root)` | Recursively read a directory into a searchable file collection. |
| `createFiles(files)` | Create a searchable collection from in-memory files. |
| `findBrowser()` | Return a verified Chromium-compatible executable path, if found. |
| `parseArguments(args)` | Parse CLI-style arguments into a detector configuration. |
| `showVisualFindings(page, findings)` | Add interactive highlights and wait for the page to close. |
| `screenshotVisualFindings(page, findings, path)` | Save a full-page screenshot with highlights. |
| `screenshotProblemReport(page, findings, path)` | Save a report with explanations and element screenshots. |

## Core shapes

A rule has an `id`, `title`, `description`, and a `match(context)` function. The function returns either `{ matches: false }` or a match containing an explanation and optional references.

File references identify a path, line, column, and source excerpt. Browser references identify an element with a CSS selector or an `xpath=` selector. Browser findings must provide exact element references.
