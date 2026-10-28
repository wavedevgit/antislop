<section class="hero">
  <h1>Catch the patterns that make generated sites feel generated.</h1>
  <p class="lede">AntiSlop scans source files or a live page for the recurring design decisions that make AI-built interfaces feel interchangeable.</p>
  <div class="actions">
    <a class="button primary" href="#/rules/README">Browse 44 rules</a>
    <a class="button" href="https://github.com/wavedevgit/antislop">View source</a>
  </div>
</section>

<div class="scan-example">
  <strong>Actual browser scan</strong>
  <p>Output from a page containing an inset accent-stripe card.</p>
</div>

```json
[
  {
    "rule": {
      "id": "no-accent-stripe-cards",
      "title": "Accent stripe cards",
      "description": "AI-generated landing pages often decorate rounded cards with a thick colored stripe along the top or left edge."
    },
    "explanation": "1 accent-stripe card was found.",
    "references": [
      {
        "type": "element",
        "selector": "xpath=/html/body/div",
        "source": "<div class=\"card\">Stripe card</div>"
      }
    ]
  }
]
```

## Run it

<div class="commands">
  <div class="command">
    <div>
      <h3>Install the agent skill</h3>
      <p>Set the palette, typography, and themes before implementation, then require a scan before completion.</p>
    </div>
    <pre><code class="language-bash">npx skills add wavedevgit/antislop \
  --skill antislop-design</code></pre>
  </div>
  <div class="command">
    <div>
      <h3>Find a browser</h3>
      <p>Locate and verify a Chromium-compatible executable. The working path is cached for later scans.</p>
    </div>
    <pre><code class="language-bash">npx --yes \
  --package=github:wavedevgit/antislop \
  antislop --find-browser</code></pre>
  </div>
  <div class="command">
    <div>
      <h3>Scan a page</h3>
      <p>Inspect computed styles, rendered layout, and interaction states in a real browser.</p>
    </div>
    <pre><code class="language-bash">npx --yes \
  --package=github:wavedevgit/antislop \
  antislop --browser /path/to/chromium \
  --url http://localhost:3000</code></pre>
  </div>
  <div class="command">
    <div>
      <h3>Scan source</h3>
      <p>Check HTML, CSS, and supported Tailwind utilities when no browser is available.</p>
    </div>
    <pre><code class="language-bash">npx --yes \
  --package=github:wavedevgit/antislop \
  antislop --folder ./path/to/site</code></pre>
  </div>
</div>

## What it checks

<div class="categories">
  <a class="category" href="#/rules/README"><span>Copy</span><small>5 rules</small></a>
  <a class="category" href="#/rules/README"><span>Typography</span><small>7 rules</small></a>
  <a class="category" href="#/rules/README"><span>Visual</span><small>19 rules</small></a>
  <a class="category" href="#/rules/README"><span>Layout</span><small>8 rules</small></a>
  <a class="category" href="#/rules/README"><span>Structure</span><small>3 rules</small></a>
  <a class="category" href="#/rules/README"><span>Quality</span><small>2 rules</small></a>
</div>

## Why browser scans

<p>File scans cannot reliably resolve computed styles, rendered layout, or responsive behavior. Browser scans run against the page a visitor actually sees and return the element, the rule, and the reason.</p>

<p>Both modes share the same rule IDs and exit behavior. Unknown rule IDs fail instead of being ignored. See the <a href="#/cli">CLI reference</a> for every option, default, and exit status.</p>
