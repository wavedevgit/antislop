const examples = {
    'limit-em-dashes': `<div><h2>Fast — flexible — effortless</h2><p>Everything you need — all in one place.</p></div>`,
    'limit-emojis': `<div><p class="emoji">🚀 &nbsp;🎯 &nbsp;✨ &nbsp;🔥</p><h2>Supercharge your workflow</h2></div>`,
    'limit-hero-heading-lines': `<div class="hero-lines"><h2>Build<br>better<br>products<br>together</h2><p>The hero message takes too long to scan.</p></div>`,
    'no-accent-stripe-cards': `<article class="card accent-stripe"><h2>Analytics</h2><p>A thick accent stripe decorates the card.</p></article>`,
    'no-ai-color-palette': `<div class="swatches"><span class="cream">Cream<small>#F4EADB</small></span><span class="indigo">Indigo<small>#4F46E5</small></span><span class="lime">Neon green<small>#00FF00</small></span></div>`,
    'no-alignment-problems': `<div class="misaligned"><article class="card"><p>Longer testimonial copy wraps onto another line.</p><strong>Ava</strong></article><article class="card"><p>Short copy.</p><strong>Ben</strong></article><article class="card"><p>Short copy.</p><strong>Cam</strong></article></div>`,
    'no-aurora-backgrounds': `<section class="aurora"><h2>Build something bright</h2></section>`,
    'no-buzzwords': `<div><h2>A seamless, game-changing experience.</h2><p>Blazing-fast workflows made with love.</p></div>`,
    'no-cramped-header-spacing': `<div class="cramped"><nav><strong>Brand</strong><span>About&nbsp;&nbsp;&nbsp; Work</span></nav><h2>A heading touches the navbar</h2></div>`,
    'no-decorative-live-status': `<span class="live"><i></i> Community online</span>`,
    'no-decorative-monospace': `<code class="status-code">SYSTEM STATUS: ALL SERVICES OPERATIONAL</code>`,
    'no-divided-list-rows': `<dl class="divided"><div><dt>Design</dt><dd>12 lessons</dd></div><div><dt>Engineering</dt><dd>18 lessons</dd></div><div><dt>Marketing</dt><dd>9 lessons</dd></div></dl>`,
    'no-excessive-letter-spacing': `<h2 class="wide-tracking">DISCOVER THE DIFFERENCE</h2>`,
    'no-excessive-padding': `<article class="card excessive-padding"><strong>Tiny message</strong></article>`,
    'no-extreme-card-radius': `<article class="card extreme-radius"><strong>Over-rounded card</strong><p>The corners squeeze the content.</p></article>`,
    'no-eyebrows-over-all-titles': `<div class="eyebrows"><small>FEATURES</small><h2>Everything you need</h2><small>WORKFLOW</small><h2>Move faster</h2></div>`,
    'no-fake-logo-cards': `<div class="fake-logo"><span>◇</span><strong>AcmeFlow</strong></div>`,
    'no-ghost-cards': `<article class="card ghost"><strong>Ghost card</strong><p>Hairline border plus a wide shadow.</p></article>`,
    'no-glassmorphism-everywhere': `<section class="glass-stage"><article>Glass card</article><article>Another glass card</article></section>`,
    'no-headline-badges': `<div><span class="headline-badge">✨ New release</span><h2>Build better products</h2></div>`,
    'no-hover-card-borders': `<div class="hover-demo"><article class="card"><small>DEFAULT</small><strong>Project overview</strong><p>Quarterly activity</p></article><article class="card hover-border"><small>HOVER ME</small><strong>Project overview</strong><p>Quarterly activity</p></article></div>`,
    'no-inconsistent-button-heights': `<div class="buttons heights"><button>Get on GitHub</button><button>Learn More</button></div>`,
    'no-inconsistent-button-radius': `<div class="buttons radii"><button>Primary</button><button>Secondary</button></div>`,
    'no-line-before-label': `<div class="line-label"><small>OUR PROCESS</small><h2>How it works</h2></div>`,
    'no-low-contrast': `<div><h2>Readable heading</h2><p class="low-contrast">This paragraph is too faint to read comfortably.</p></div>`,
    'no-mostly-italic-titles': `<div class="italic-titles"><h2>Beautifully simple</h2><h2>Designed for you</h2></div>`,
    'no-navbar-theme-toggle': `<nav class="dark-nav"><strong>Brand</strong><span>Docs&nbsp;&nbsp; Pricing&nbsp;&nbsp; ◐</span></nav>`,
    'no-neon-borders': `<article class="neon"><small>AI POWERED</small><p>Glowing cyan border</p></article>`,
    'no-nested-cards': `<article class="card outer"><strong>Account</strong><article class="card inner">Plan details inside another card</article></article>`,
    'no-oversized-cta-headings': `<div class="oversized-cta"><h2>READY TO<br>GET STARTED?</h2><button>Start now</button></div>`,
    'no-oversized-navbar': `<nav class="oversized-nav"><strong>Brand</strong><span>Features&nbsp;&nbsp; Pricing&nbsp;&nbsp; About&nbsp;&nbsp; <button>Sign up</button></span></nav>`,
    'no-overused-fonts': `<div class="overused"><h2>DM Sans everywhere</h2><p>The default AI landing-page typeface.</p></div>`,
    'no-patterned-backgrounds': `<section class="pattern"><article class="card"><strong>Patterned hero</strong><p>Dots fill the entire background.</p></article></section>`,
    'no-pill-buttons': `<button class="pill">Start free trial</button>`,
    'no-slop-icons': `<div class="slop-icons"><span>⌂</span><span>◎</span><span>♡</span><span>≡</span><p>Lucide icons on every action</p></div>`,
    'no-soft-corners-everywhere': `<div class="soft-corners"><button>Search</button><article>Card</article><input placeholder="Input"><aside>Panel</aside></div>`,
    'no-text-arrows': `<a class="text-arrow" href="#">Learn more →</a>`,
    'no-text-overflow': `<div class="overflow"><span>Quarterly revenue summary for North America</span></div>`,
    'no-thick-colored-card-borders': `<article class="card thick-border"><strong>Featured plan</strong><p>A thick blue outline competes with content.</p></article>`,
    'no-unicode-bullets': `<div class="unicode-list">• Fast setup<br>• Seamless workflow<br>• Built with love</div>`,
    'no-unstyled-text-buttons': `<nav class="unstyled"><strong>Northstar</strong><span><button>Docs</button><button>Pricing</button><button>Log in</button></span></nav>`,
    'no-visible-gradients': `<section class="gradient"><h2>Ship your next idea</h2><button>Get started</button></section>`,
};

const rule = new URLSearchParams(location.search).get('rule');

const preview = document.querySelector('#preview');

preview.dataset.rule = rule;

preview.innerHTML = examples[rule] || '<p>Preview unavailable.</p>';
