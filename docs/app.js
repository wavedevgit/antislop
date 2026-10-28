document
    .querySelector('.menu-button')
    .addEventListener('click', function (event) {
        event.stopPropagation();
        document.body.classList.toggle('close');
    });

const seen = new WeakMap();

new MutationObserver(function () {
    const rule = location.hash.match(/^#\/rules\/([a-z0-9-]+)(?:\.md)?/);

    const screenshot = document.querySelector(
        '.markdown-section img[src*="/rules/assets/"]',
    );

    if (rule && screenshot) {
        const frame = document.createElement('iframe');
        frame.className = 'rule-preview';
        frame.title = screenshot.alt || 'Rule example';
        frame.src = `preview.html?rule=${encodeURIComponent(rule[1])}`;
        frame.sandbox = 'allow-scripts';
        screenshot.replaceWith(frame);
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
}).observe(document.body, { childList: true, subtree: true });
