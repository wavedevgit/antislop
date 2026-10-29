const findings = [
    {
        selector: '[data-highlight="aurora"]',
        title: 'Aurora glow background',
        ruleId: 'no-aurora-backgrounds',
        description: 'AI-generated hero sections often use oversized blurred color blobs or layered radial gradients as atmospheric decoration.',
        explanation: '2 aurora-style background elements were found.',
    },
    {
        selector: '[data-highlight="gradient"]',
        title: 'Visible gradients',
        ruleId: 'no-visible-gradients',
        description: 'AI-generated websites often overuse clearly visible gradients; subtle lighting effects are allowed.',
        explanation: '2 clearly visible gradients were found out of 2 total gradients.',
    },
    {
        selector: '[data-highlight="badge"]',
        title: 'Headline badge',
        ruleId: 'no-headline-badges',
        description: 'AI-generated landing pages often place a decorative pill badge directly above the main headline.',
        explanation: '1 badge was found above a main headline.',
    },
    {
        selector: '.spaces article',
        title: 'Card border on hover',
        ruleId: 'no-hover-card-borders',
        description: 'Adding a border only on hover makes cards shift or flash an unnecessary outline.',
        explanation: '3 cards add a border on hover.',
    },
    {
        selector: 'nav button, .site-actions button:not(.text-action)',
        title: 'Inconsistent button radius',
        ruleId: 'no-inconsistent-button-radius',
        description: 'Buttons in the same interface should not switch arbitrarily between square and rounded corners.',
        explanation: '2 buttons use inconsistent corner radii (7px, 9px).',
    },
    {
        selector: 'nav button',
        title: 'Low contrast text',
        ruleId: 'no-low-contrast',
        description: 'Text should meet WCAG AA contrast against the surface behind it.',
        explanation: '1 text element falls below WCAG AA contrast. Lowest is 4.4:1.',
    },
    {
        selector: '.activity',
        title: 'Ghost cards',
        ruleId: 'no-ghost-cards',
        description: 'A hairline border paired with a wide soft shadow makes both effects compete to define the same card.',
        explanation: '1 ghost card pairs a hairline border with a wide shadow.',
    },
    {
        selector: '.spaces article',
        title: 'Excessive padding',
        ruleId: 'no-excessive-padding',
        description: 'AI-generated sites often add large amounts of padding to ordinary elements without a clear layout reason.',
        explanation: '3 visible elements use excessive padding or oversized collapsed disclosure rows.',
    },
    {
        selector: '.text-action',
        title: 'Unstyled text button',
        ruleId: 'no-unstyled-text-buttons',
        description: 'Text-like navigation actions should use links unless the button has a visible base or hover treatment.',
        explanation: '1 text button has no background, hover background, border color, or corner radius; use a link for navigation.',
    },
];

function renderFinding(step) {
    const finding = findings[step];
    const previous = [...document.querySelectorAll('anti-slop-visualizer')];

    const duration = matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 120
        : 180;

    previous.forEach(function (visualizer) {
        visualizer.style.setProperty('opacity', '0', 'important');
        setTimeout(() => visualizer.remove(), duration);
    });

    if (!finding) return;

    const host = document.createElement('anti-slop-visualizer');
    host.style.cssText =
        `all:initial!important;position:fixed!important;inset:0!important;z-index:2147483647!important;pointer-events:none!important;opacity:0!important;transition:opacity ${duration}ms cubic-bezier(0.23,1,0.32,1)!important;`;

    const targets = [...document.querySelectorAll(finding.selector)];
    const root = host.attachShadow({ mode: 'closed' });
    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; position: fixed; inset: 0; z-index: 2147483647; pointer-events: none; font-family: ui-sans-serif, system-ui, sans-serif; }
      .mark { position: fixed; box-sizing: border-box; outline: 1px solid #f43f5e; pointer-events: none; }
      .label { position: absolute; left: 0; bottom: 100%; max-width: 420px; padding: 4px 7px; overflow: hidden; color: #fff; background: #be123c; font: 700 11px/1.2 ui-sans-serif, system-ui, sans-serif; opacity: 1; text-overflow: ellipsis; white-space: nowrap; }
      .mark.label-below .label { top: 100%; bottom: auto; }
      .mark.label-left .label { right: 0; left: auto; }
      .mark.active { outline-width: 2px; }
      .tooltip { position: fixed; top: 16px; right: 16px; display: block; width: min(340px, calc(100vw - 32px)); max-height: calc(100vh - 32px); box-sizing: border-box; overflow: hidden auto; padding: 12px 14px; color: #fafafa; background: #171717; border: 1px solid #737373; border-radius: 8px; font: 13px/1.45 ui-sans-serif, system-ui, sans-serif; pointer-events: none; }
      .tooltip.left { right: auto; left: 16px; }
      .tooltip strong { display: block; margin-bottom: 3px; color: #fff; font-size: 14px; }
      .tooltip code { color: #d4d4d4; font: 11px/1.2 ui-monospace, monospace; }
      .tooltip p { margin: 6px 0 0; }
    `;
    root.append(style);

    targets.forEach(function (target) {
            const rect = target.getBoundingClientRect();
            const mark = document.createElement('div');
            const label = document.createElement('span');

            mark.className = 'mark active';
            mark.classList.toggle('label-below', rect.top < 24);
            mark.classList.toggle('label-left', rect.right > innerWidth - 420);
            mark.style.height = `${rect.height}px`;
            mark.style.left = `${rect.left}px`;
            mark.style.top = `${rect.top}px`;
            mark.style.width = `${rect.width}px`;
            label.className = 'label';
            label.textContent = finding.title;
            mark.append(label);
            root.append(mark);
        });

    const tooltip = document.createElement('div');
    const title = document.createElement('strong');
    const id = document.createElement('code');
    const description = document.createElement('p');
    const explanation = document.createElement('p');

    tooltip.className = 'tooltip';
    tooltip.classList.toggle(
        'left',
        targets.some(function (target) {
            const rect = target.getBoundingClientRect();

            return rect.top < 360 && rect.right > innerWidth - 360;
        }),
    );
    title.textContent = finding.title;
    id.textContent = finding.ruleId;
    description.textContent = finding.description;
    explanation.textContent = finding.explanation;
    tooltip.append(title, id, description, explanation);
    root.append(tooltip);
    document.documentElement.append(host);

    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            host.style.setProperty('opacity', '1', 'important');
        });
    });
}

addEventListener('message', function (event) {
    if (event.data?.type !== 'antislop-demo') return;

    document.body.dataset.step = String(event.data.step);
    requestAnimationFrame(() => renderFinding(event.data.step));
});

addEventListener('resize', function () {
    renderFinding(Number(document.body.dataset.step));
});
