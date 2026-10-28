document
    .querySelector('.menu-button')
    .addEventListener('click', function (event) {
        event.stopPropagation();
        document.body.classList.toggle('close');
    });

const seen = new WeakMap();

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
}

new MutationObserver(updatePage).observe(document.body, {
    childList: true,
    subtree: true,
});

updatePage();
