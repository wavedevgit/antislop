import type { Page } from "puppeteer-core";

import type { Finding } from "../detector/index.ts";

async function renderVisualFindings(page: Page, findings: readonly Finding[], fullPage: boolean): Promise<void> {
  const highlights = findings.flatMap((finding) => finding.references
    .filter((reference) => reference.type === "element")
    .map((reference) => ({
      selector: reference.selector,
      title: finding.rule.title,
      ruleId: finding.rule.id,
      description: finding.rule.description,
      explanation: finding.explanation,
      text: reference.text,
      occurrence: reference.occurrence,
    })));

  await page.evaluate((items, fullPage) => {
    document.querySelector("anti-slop-visualizer")?.remove();

    const host = document.createElement("anti-slop-visualizer");
    host.style.cssText = `all:initial!important;position:${fullPage ? "absolute" : "fixed"}!important;inset:0!important;width:${fullPage ? `${document.documentElement.scrollWidth}px` : "auto"}!important;height:${fullPage ? `${document.documentElement.scrollHeight}px` : "auto"}!important;z-index:2147483647!important;pointer-events:none!important;`;
    const root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = `
      :host { all: initial; position: ${fullPage ? "absolute" : "fixed"}; inset: 0; z-index: 2147483647; pointer-events: none; font-family: ui-sans-serif, system-ui, sans-serif; }
      .mark { position: ${fullPage ? "absolute" : "fixed"}; box-sizing: border-box; outline: 1px solid #f43f5e; pointer-events: none; }
      .label { position: absolute; left: 0; bottom: 100%; max-width: 420px; padding: 4px 7px; overflow: hidden; color: #fff; background: #be123c; font: 700 11px/1.2 ui-sans-serif, system-ui, sans-serif; opacity: ${fullPage ? "1" : "0"}; text-overflow: ellipsis; white-space: nowrap; }
      .mark.label-below .label { top: 100%; bottom: auto; }
      .mark.label-left .label { right: 0; left: auto; }
      .mark.active { outline-width: 2px; }
      .mark.active .label { opacity: 1; }
      .tooltip { position: fixed; top: 16px; right: 16px; display: none; width: min(340px, calc(100vw - 32px)); max-height: calc(100vh - 32px); box-sizing: border-box; overflow: hidden auto; padding: 12px 14px; color: #fafafa; background: #171717; border: 1px solid #737373; font: 13px/1.45 ui-sans-serif, system-ui, sans-serif; pointer-events: none; }
      .tooltip section + section { margin-top: 12px; padding-top: 12px; border-top: 1px solid #404040; }
      .tooltip strong { display: block; margin-bottom: 3px; color: #fff; font-size: 14px; }
      .tooltip code { color: #d4d4d4; font: 11px/1.2 ui-monospace, monospace; }
      .tooltip p { margin: 6px 0 0; }
    `;
    root.append(style);

    const resolve = (selector: string): Element | null => {
      try {
        if (selector.startsWith("xpath=")) {
          const node = document.evaluate(selector.slice(6), document, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;

          return node instanceof Element ? node : null;
        }

        return document.querySelector(selector);
      } catch {
        return null;
      }
    };

    const grouped = new Map<Element, typeof items>();
    const textTargets: Array<{ element: Element; range: Range; group: typeof items }> = [];

    const textRange = (element: Element, text: string, occurrence: number): Range | null => {
      const needle = text.toLowerCase();
      let seen = 0;

      for (const node of element.childNodes) {
        if (node.nodeType !== Node.TEXT_NODE) continue;

        const value = node.textContent ?? "";
        let from = 0;

        while (from <= value.length - text.length) {
          const index = value.toLowerCase().indexOf(needle, from);

          if (index < 0) break;

          if (seen === occurrence) {
            const range = document.createRange();
            range.setStart(node, index);
            range.setEnd(node, index + text.length);

            return range;
          }

          seen += 1;
          from = index + text.length;
        }
      }

      return null;
    };

    for (const item of items) {
      const element = resolve(item.selector);

      if (!element) continue;

      if (item.text) {
        const range = textRange(element, item.text, item.occurrence ?? 0);

        if (range) textTargets.push({ element, range, group: [item] });
        continue;
      }

      const group = grouped.get(element) ?? [];

      if (!group.some((entry) => entry.ruleId === item.ruleId)) group.push(item);
      grouped.set(element, group);
    }

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    root.append(tooltip);

    const marks: Array<{ element: Element; range?: Range; mark: HTMLDivElement }> = [];

    const showTooltip = (group: typeof items) => {
      tooltip.replaceChildren();

      for (const data of group) {
        const section = document.createElement("section");
        const title = document.createElement("strong");
        title.textContent = data.title;
        const id = document.createElement("code");
        id.textContent = data.ruleId;
        const description = document.createElement("p");
        description.textContent = data.description;
        const explanation = document.createElement("p");
        explanation.textContent = data.explanation;
        section.append(title, id, description, explanation);
        tooltip.append(section);
      }

      tooltip.style.display = "block";
    };

    for (const { element, range, group } of [
      ...[...grouped].map(([element, group]) => ({ element, range: undefined, group })),
      ...textTargets,
    ]) {
      const mark = document.createElement("div");
      mark.className = "mark";

      const label = document.createElement("span");
      label.className = "label";
      label.textContent = group.map((item) => item.title).join(" + ");

      mark.append(label);
      element.addEventListener("mouseenter", () => {
        mark.classList.add("active");
        showTooltip(group);
      });
      element.addEventListener("focusin", () => {
        mark.classList.add("active");
        showTooltip(group);
      });
      element.addEventListener("mouseleave", () => {
        mark.classList.remove("active");
        tooltip.style.display = "none";
      });
      element.addEventListener("focusout", () => {
        mark.classList.remove("active");
        tooltip.style.display = "none";
      });
      root.append(mark);
      marks.push({ element, range, mark });
    }

    let frame = 0;

    const isVisible = (element: Element, rect: DOMRect) => {
      const closedDetails = element.closest("details:not([open])");
      const visibleSummary = closedDetails?.querySelector(":scope > summary");

      if (closedDetails && element !== closedDetails && !visibleSummary?.contains(element)) return false;

      if (!fullPage && (rect.bottom <= 0 || rect.right <= 0 || rect.top >= innerHeight || rect.left >= innerWidth)) return false;

      let current: Element | null = element;

      while (current) {
        const style = getComputedStyle(current);

        if (style.display === "none" || style.visibility !== "visible" || style.opacity === "0") return false;
        current = current.parentElement;
      }

      return rect.width > 0 && rect.height > 0;
    };

    const positionMarks = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        tooltip.style.display = "none";

        for (const { element, range, mark } of marks) {
          const rect = range?.getBoundingClientRect() ?? element.getBoundingClientRect();
          mark.style.display = isVisible(element, rect) ? "block" : "none";
          mark.classList.toggle("label-below", rect.top + (fullPage ? scrollY : 0) < 24);
          mark.classList.toggle("label-left", rect.right > innerWidth - 420);
          mark.style.left = `${rect.left + (fullPage ? scrollX : 0)}px`;
          mark.style.top = `${rect.top + (fullPage ? scrollY : 0)}px`;
          mark.style.width = `${rect.width}px`;
          mark.style.height = `${rect.height}px`;
        }
      });
    };

    positionMarks();
    addEventListener("scroll", positionMarks, true);
    addEventListener("resize", positionMarks);
    addEventListener("toggle", positionMarks, true);
    document.documentElement.append(host);
  }, highlights, fullPage);

  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => { resolve(); }))));
}

export async function screenshotVisualFindings(page: Page, findings: readonly Finding[], path: string): Promise<void> {
  await renderVisualFindings(page, findings, true);
  await page.screenshot({ path, fullPage: true, type: "png" });
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

async function screenshotAlignmentRow(page: Page, selectors: readonly string[]): Promise<string | undefined> {
  const clip = await page.evaluate((selectors) => {
    const resolve = (selector: string): Element | null => {
      try {
        if (selector.startsWith("xpath=")) {
          const node = document.evaluate(selector.slice(6), document, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;

          return node instanceof Element ? node : null;
        }

        return document.querySelector(selector);
      } catch {
        return null;
      }
    };

    const elements = selectors.map(resolve).filter((element): element is Element => Boolean(element));

    if (elements.length < 2) return null;

    const boxes = elements.map((element) => element.getBoundingClientRect());
    const verticalOverlap = Math.min(...boxes.map((box) => box.bottom)) - Math.max(...boxes.map((box) => box.top));

    if (verticalOverlap <= 0) return null;

    let row: Element | null = elements[0] ?? null;

    while (row && !elements.every((element) => row?.contains(element))) row = row.parentElement;

    if (!row || row === document.body || row === document.documentElement) return null;

    document.querySelector("anti-slop-report-highlights")?.remove();

    const host = document.createElement("anti-slop-report-highlights");
    host.style.cssText = `all:initial;position:absolute;inset:0;width:${document.documentElement.scrollWidth}px;height:${document.documentElement.scrollHeight}px;z-index:2147483647;pointer-events:none;`;

    for (const box of boxes) {
      const mark = document.createElement("div");
      mark.style.cssText = `position:absolute;box-sizing:border-box;left:${box.left + scrollX}px;top:${box.top + scrollY}px;width:${box.width}px;height:${box.height}px;border:3px solid #ef4056;background:rgb(239 64 86 / 12%);`;
      host.append(mark);
    }

    document.documentElement.append(host);

    const box = row.getBoundingClientRect();
    const padding = 16;
    const x = Math.max(0, box.left + scrollX - padding);
    const y = Math.max(0, box.top + scrollY - padding);

    return {
      x,
      y,
      width: Math.min(1400, document.documentElement.scrollWidth - x, box.width + padding * 2),
      height: Math.min(720, document.documentElement.scrollHeight - y, box.height + padding * 2),
    };
  }, selectors);

  if (!clip || clip.width <= 0 || clip.height <= 0) return undefined;

  try {
    const image = await page.screenshot({ type: "png", clip, captureBeyondViewport: true });

    return Buffer.from(image).toString("base64");
  } finally {
    await page.evaluate(() => document.querySelector("anti-slop-report-highlights")?.remove());
  }
}

export async function screenshotProblemReport(page: Page, findings: readonly Finding[], path: string): Promise<void> {
  const sections: Array<{ title: string; id: string; description: string; explanation: string; elementCount: number; images: Array<{ data: string; selector: string }> }> = [];

  for (const finding of findings) {
    const images: Array<{ data: string; selector: string }> = [];
    const references = finding.references.filter((reference) => reference.type === "element");

    if (finding.rule.id === "no-alignment-problems") {
      const data = await screenshotAlignmentRow(page, references.map((reference) => reference.selector));

      if (data) images.push({ data, selector: `Shared row · ${references.length} highlighted elements` });
    }

    for (const reference of images.length > 0 ? [] : references) {
      const clip = await page.evaluate((item) => {
        const resolve = (selector: string): Element | null => {
          try {
            if (selector.startsWith("xpath=")) {
              const node = document.evaluate(selector.slice(6), document, null, XPathResult.FIRST_ORDERED_NODE_TYPE).singleNodeValue;

              return node instanceof Element ? node : null;
            }

            return document.querySelector(selector);
          } catch {
            return null;
          }
        };

        const element = resolve(item.selector);

        if (!element) return null;

        let rect = element.getBoundingClientRect();

        if (item.text) {
          const needle = item.text.toLowerCase();
          let seen = 0;

          for (const node of element.childNodes) {
            if (node.nodeType !== Node.TEXT_NODE) continue;

            const value = node.textContent ?? "";
            let from = 0;

            while (from <= value.length - item.text.length) {
              const index = value.toLowerCase().indexOf(needle, from);

              if (index < 0) break;

              if (seen === (item.occurrence ?? 0)) {
                const range = document.createRange();
                range.setStart(node, index);
                range.setEnd(node, index + item.text.length);
                rect = range.getBoundingClientRect();
                break;
              }

              seen += 1;
              from = index + item.text.length;
            }
          }
        }

        const padding = 12;
        const x = Math.max(0, rect.left + scrollX - padding);
        const y = Math.max(0, rect.top + scrollY - padding);

        return {
          x,
          y,
          width: Math.min(960, document.documentElement.scrollWidth - x, rect.width + padding * 2),
          height: Math.min(540, document.documentElement.scrollHeight - y, rect.height + padding * 2),
        };
      }, reference);

      if (!clip || clip.width <= 0 || clip.height <= 0) continue;

      const image = await page.screenshot({ type: "png", clip, captureBeyondViewport: true });

      images.push({ data: Buffer.from(image).toString("base64"), selector: reference.selector });
    }

    sections.push({
      title: finding.rule.title,
      id: finding.rule.id,
      description: finding.rule.description,
      explanation: finding.explanation,
      elementCount: references.length,
      images,
    });
  }

  const report = await page.browser().newPage();

  try {
    await report.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });

    const elementCount = sections.reduce((count, section) => count + section.elementCount, 0);

    const content = sections.map((section, index) => `
      <section class="finding">
        <div class="number">${String(index + 1).padStart(2, "0")}</div>
        <div class="copy">
          <div class="rule"><code>${escapeHtml(section.id)}</code><span>${section.elementCount} ${section.elementCount === 1 ? "element" : "elements"}</span></div>
          <h2>${escapeHtml(section.title)}</h2>
          <p class="explanation">${escapeHtml(section.explanation)}</p>
          <p class="description">${escapeHtml(section.description)}</p>
        </div>
        <div class="shots">
          ${section.images.length > 0
            ? section.images.map((image) => `<figure><img src="data:image/png;base64,${image.data}"><figcaption>${escapeHtml(image.selector)}</figcaption></figure>`).join("")
            : "<p class=missing>No visible element screenshot was available.</p>"}
        </div>
      </section>
    `).join("");

    await report.setContent(`<!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            * { box-sizing: border-box; }
            html { background: #e8edf2; }
            body { width: 1440px; margin: 0; color: #172033; background: #f7f9fb; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
            header { position: relative; padding: 56px 64px 48px; color: white; background: #172033; border-bottom: 6px solid #22d3ee; }
            .brand { position: absolute; top: 48px; right: 64px; color: #22d3ee; font-size: 72px; font-weight: 900; line-height: 1; letter-spacing: -.05em; }
            h1 { max-width: 900px; margin: 0; font-size: 52px; line-height: 1; letter-spacing: -.04em; }
            header p { max-width: 1000px; margin: 22px 0 0; color: #d5dce6; font-size: 16px; line-height: 1.5; overflow-wrap: anywhere; }
            .summary { display: flex; gap: 30px; margin-top: 32px; }
            .summary strong { margin-right: 7px; font-size: 24px; }
            main { padding: 0 64px 64px; }
            .finding { display: grid; grid-template-columns: 52px 1fr; gap: 0 24px; padding: 44px 0 48px; border-bottom: 1px solid #cbd3dd; }
            .number { padding-top: 5px; color: #0891b2; font-size: 15px; font-weight: 800; line-height: 1; }
            .copy { max-width: 900px; }
            .rule { display: flex; align-items: center; gap: 12px; }
            .rule code { color: #526176; font: inherit; font-size: 12px; font-weight: 700; line-height: 1.2; }
            .rule span { padding-left: 12px; color: #718096; border-left: 1px solid #cbd3dd; font-size: 12px; }
            h2 { margin: 12px 0 8px; font-size: 30px; line-height: 1.1; letter-spacing: -.025em; }
            .explanation { margin: 0; font-size: 17px; font-weight: 700; line-height: 1.45; }
            .description { max-width: 820px; margin: 8px 0 0; color: #607086; font-size: 14px; line-height: 1.5; }
            .shots { grid-column: 2; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-top: 26px; }
            figure { min-width: 0; margin: 0; overflow: hidden; background: white; border: 1px solid #b9c4d0; }
            img { display: block; width: 100%; height: 300px; object-fit: contain; background-color: #fff; background-image: linear-gradient(45deg, #f1f4f7 25%, transparent 25%), linear-gradient(-45deg, #f1f4f7 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f1f4f7 75%), linear-gradient(-45deg, transparent 75%, #f1f4f7 75%); background-position: 0 0, 0 8px, 8px -8px, -8px 0; background-size: 16px 16px; }
            figcaption { padding: 10px 12px; overflow: hidden; color: #526176; border-top: 1px solid #d8dee6; font-size: 11px; line-height: 1.3; text-overflow: ellipsis; white-space: nowrap; }
            .missing { grid-column: 1 / -1; margin: 0; padding: 20px; color: #718096; border: 1px dashed #b9c4d0; }
            .empty { padding: 80px 0; color: #607086; font-size: 18px; }
          </style>
        </head>
        <body>
          <header>
            <div class="brand">ANTISLOP</div>
            <h1>${findings.length === 0 ? "No problems found" : `${findings.length} ${findings.length === 1 ? "problem" : "problems"} found`}</h1>
            <p>${escapeHtml(page.url())}</p>
            <div class="summary"><span><strong>${findings.length}</strong> rules triggered</span><span><strong>${elementCount}</strong> elements captured</span></div>
          </header>
          <main>${content || '<p class="empty">The enabled rules found no problems on this page.</p>'}</main>
        </body>
      </html>`, { waitUntil: "load" });

    await report.screenshot({ path, fullPage: true, type: "png" });
  } finally {
    await report.close();
  }
}

export async function showVisualFindings(page: Page, findings: readonly Finding[]): Promise<void> {
  await renderVisualFindings(page, findings, false);

  if (page.isClosed()) return;

  await new Promise<void>((resolve) => {
    const browser = page.browser();

    const done = () => {
      page.off("close", done);
      browser.off("disconnected", done);
      resolve();
    };

    page.once("close", done);
    browser.once("disconnected", done);
  });
}
