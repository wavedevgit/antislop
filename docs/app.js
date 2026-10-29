document
    .querySelector('.menu-button')
    .addEventListener('click', function (event) {
        event.stopPropagation();
        document.body.classList.toggle('close');
    });

const seen = new WeakMap();

let demoController;

let demoVisibilityObserver;

const codePreviews = {
    'no-monolithic-html': [
        ' index.html',
        '-  <style>/* all styles */</style>',
        '-  <script>/* all behavior */</script>',
        '+  <link rel="stylesheet" href="styles.css">',
        '+  <script src="app.js"></script>',
    ],
    'require-meta-tags': [
        ' <head>',
        '-  <title>Untitled</title>',
        '+  <meta name="viewport" content="width=device-width, initial-scale=1">',
        '+  <meta name="description" content="A clear page description.">',
        '+  <title>Product name</title>',
        ' </head>',
    ],
};

function setDemoStep(demo, step) {
    const total = demo.querySelectorAll(
        '[data-demo-step]:not([data-demo-step="-1"])',
    ).length;

    demo.dataset.step = String(step);
    demo.querySelectorAll('[data-demo-step]').forEach(function (stage) {
        stage.dataset.active = String(Number(stage.dataset.demoStep) === step);
    });
    demo.querySelector('.demo-progress span').style.transform =
        `scaleX(${Math.max(0, step + 1) / total})`;
    demo.querySelector('iframe').contentWindow?.postMessage(
        { type: 'antislop-demo', step },
        '*',
    );
}

function bindScrollDemo(demo) {
    if (demo.dataset.scrollBound) return;

    demo.dataset.scrollBound = 'true';
    demoController?.abort();
    demoVisibilityObserver?.disconnect();

    demoController = new AbortController();
    const markers = [...demo.querySelectorAll('.demo-stage-marker')];
    let scrollFrame = 0;

    function updateStep() {
        scrollFrame = 0;

        const viewportCenter = innerHeight / 2;

        const active = markers.reduce(function (closest, marker) {
            const distance = Math.abs(
                marker.getBoundingClientRect().top - viewportCenter,
            );

            return distance < closest.distance
                ? { distance, marker }
                : closest;
        }, { distance: Infinity, marker: markers[0] });

        const step = Number(active.marker.parentElement.dataset.demoStep);

        if (step !== Number(demo.dataset.step)) setDemoStep(demo, step);
    }

    function requestStepUpdate() {
        if (scrollFrame) return;

        scrollFrame = requestAnimationFrame(updateStep);
    }

    addEventListener('scroll', requestStepUpdate, {
        passive: true,
        signal: demoController.signal,
    });
    addEventListener('resize', requestStepUpdate, {
        signal: demoController.signal,
    });

    demoVisibilityObserver = new IntersectionObserver(
        ([entry]) => document.body.classList.toggle('demo-active', entry.isIntersecting),
        { threshold: 0.01 },
    );
    demoVisibilityObserver.observe(demo);

    const frame = demo.querySelector('iframe');
    frame.addEventListener('load', function () {
        setDemoStep(demo, Number(demo.dataset.step));
    });
    setDemoStep(demo, -1);
    requestStepUpdate();
}

function updatePage() {
    const rule = location.hash.match(/^#\/rules\/([a-z0-9-]+)(?:\.md)?/);

    const screenshot = document.querySelector(
        '.markdown-section img[src*="assets/"]',
    );

    if (rule && screenshot) {
        const diff = codePreviews[rule[1]];

        if (diff) {
            const code = document.createElement('code');

            diff.forEach(function (line) {
                const row = document.createElement('span');
                row.className = line.startsWith('+')
                    ? 'diff-add'
                    : line.startsWith('-')
                      ? 'diff-remove'
                      : '';
                row.textContent = line;
                code.append(row);
            });

            const preview = document.createElement('pre');
            preview.className = 'rule-diff';
            preview.append(code);
            screenshot.replaceWith(preview);
        } else {
            const frame = document.createElement('iframe');
            frame.className = 'rule-preview';
            frame.title = screenshot.alt || 'Rule example';
            frame.src = `preview.html?rule=${encodeURIComponent(rule[1])}`;
            frame.sandbox = 'allow-scripts';
            screenshot.replaceWith(frame);
        }
    }

    document
        .querySelectorAll('.search .matching-post p')
        .forEach(function (node) {
            const raw = node.textContent;

            if (seen.get(node) === raw) return;

            const clean = raw
                .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
                .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
                .replace(/\]\([^)]*\)/g, '')
                .replace(/<[^>]*>/g, ' ')
                .replace(/[`*_>#|[\]()]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();

            seen.set(node, clean);
            node.textContent = clean;
        });

    const demo = document.querySelector('[data-scroll-demo]');

    if (demo) {
        bindScrollDemo(demo);
    } else {
        document.body.classList.remove('demo-active');
    }
}

new MutationObserver(updatePage).observe(document.body, {
    childList: true,
    subtree: true,
});

updatePage();
