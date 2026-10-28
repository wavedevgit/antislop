window.$docsify = {
    alias: { '/.*/_sidebar.md': '/_sidebar.md' },
    auto2top: true,
    homepage: 'README.md',
    loadSidebar: true,
    name: 'AntiSlop',
    relativePath: true,
    search: {
        depth: 1,
        hideOtherSidebarContent: true,
        namespace: 'antislop-v2',
        noData: 'No matching documentation',
        placeholder: 'Search rules',
    },
    plugins: [
        function (hook) {
            hook.doneEach(function () {
                const heading = document.querySelector(
                    '.markdown-section h1',
                );

                const title =
                    heading && heading.textContent.length < 60
                        ? heading.textContent + ' · AntiSlop Docs'
                        : 'AntiSlop Docs';

                document.title = title;

                document.querySelector('.doc-footer')?.remove();

                const section =
                    document.querySelector('.markdown-section');

                if (section) {
                    const footer = document.createElement('footer');

                    footer.className = 'doc-footer';
                    footer.innerHTML =
                        '<span>AntiSlop / GPL-3.0-only</span><a href="https://github.com/wavedevgit/antislop">Source</a>';
                    section.appendChild(footer);
                }
            });
        },
    ],
};
