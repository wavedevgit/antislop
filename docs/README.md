<section class="hero">
  <h1>Catch the patterns that make generated sites feel generated.</h1>
  <p class="lede">AntiSlop scans source files or a live page for the recurring design decisions that make AI-built interfaces feel interchangeable.</p>
  <div class="actions">
    <a class="button primary" href="#/rules/README">Browse 43 rules</a>
    <a class="button" href="https://github.com/wavedevgit/antislop">View source</a>
  </div>
</section>

<div class="scan" aria-label="Example AntiSlop browser scan">
  <div class="scan-head">
    <span class="scan-dots" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="scan-title">antislop / browser scan</span>
    <span class="scan-status">3 findings</span>
  </div>
  <div class="scan-body">
    <div class="line"><span class="prompt">$</span> antislop --url http://localhost:3000</div>
    <div class="line"><span class="pass">PASS</span> chromium ready <span class="loc">1440 x 900</span></div>
    <div class="line"><span class="find">FIND</span> no-visible-gradients <span class="loc">.hero .backdrop</span></div>
    <div class="line"><span class="find">FIND</span> no-ai-color-palette <span class="loc">#4f46e5 on .badge</span></div>
    <div class="line"><span class="find">FIND</span> no-nested-cards <span class="loc">.pricing .card</span></div>
    <div class="line"><span class="pass">PASS</span> 40 rules clear</div>
    <div class="line"><span class="meta">3 findings / 0 errors / 1.8s</span></div>
  </div>
</div>

## Run it

<div class="commands">
  <div class="command">
    <div>
      <h3>Install the agent skill</h3>
      <p>Set the palette, typography, and themes before implementation, then require a scan before completion.</p>
    </div>
    <pre><code><span class="cmd">npx</span> skills add wavedevgit/antislop <span class="slash">\</span>
  <span class="flag">--skill</span> antislop-design</code></pre>
  </div>
  <div class="command">
    <div>
      <h3>Find a browser</h3>
      <p>Locate and verify a Chromium-compatible executable. The working path is cached for later scans.</p>
    </div>
    <pre><code><span class="cmd">npx</span> <span class="flag">--yes</span> <span class="slash">\</span>
  <span class="flag">--package=github:wavedevgit/antislop</span> <span class="slash">\</span>
  antislop <span class="flag">--find-browser</span></code></pre>
  </div>
  <div class="command">
    <div>
      <h3>Scan a page</h3>
      <p>Inspect computed styles, rendered layout, and interaction states in a real browser.</p>
    </div>
    <pre><code><span class="cmd">npx</span> <span class="flag">--yes</span> <span class="slash">\</span>
  <span class="flag">--package=github:wavedevgit/antislop</span> <span class="slash">\</span>
  antislop <span class="flag">--browser</span> /path/to/chromium <span class="slash">\</span>
  <span class="flag">--url</span> http://localhost:3000</code></pre>
  </div>
  <div class="command">
    <div>
      <h3>Scan source</h3>
      <p>Check HTML, CSS, and supported Tailwind utilities when no browser is available.</p>
    </div>
    <pre><code><span class="cmd">npx</span> <span class="flag">--yes</span> <span class="slash">\</span>
  <span class="flag">--package=github:wavedevgit/antislop</span> <span class="slash">\</span>
  antislop <span class="flag">--folder</span> ./path/to/site</code></pre>
  </div>
</div>

## What it checks

<div class="categories">
  <a class="category" href="#/rules/README"><span>Copy</span><small>5 rules</small></a>
  <a class="category" href="#/rules/README"><span>Typography</span><small>7 rules</small></a>
  <a class="category" href="#/rules/README"><span>Visual</span><small>18 rules</small></a>
  <a class="category" href="#/rules/README"><span>Layout</span><small>8 rules</small></a>
  <a class="category" href="#/rules/README"><span>Structure</span><small>3 rules</small></a>
  <a class="category" href="#/rules/README"><span>Quality</span><small>2 rules</small></a>
</div>

## Why browser scans

<p>File scans cannot reliably resolve computed styles, rendered layout, or responsive behavior. Browser scans run against the page a visitor actually sees and return the element, the rule, and the reason.</p>

<p>Both modes share the same rule IDs and exit behavior. Unknown rule IDs fail instead of being ignored.</p>
