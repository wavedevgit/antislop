document
    .querySelector('.menu-button')
    .addEventListener('click', function (event) {
        event.stopPropagation();
        document.body.classList.toggle('close');
    });

const seen = new WeakMap();

new MutationObserver(function () {
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

