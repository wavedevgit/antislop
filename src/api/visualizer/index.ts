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

    for (const item of items) {
      const element = resolve(item.selector);

      if (!element) continue;

      const group = grouped.get(element) ?? [];

      if (!group.some((entry) => entry.ruleId === item.ruleId)) group.push(item);
      grouped.set(element, group);
    }

    const tooltip = document.createElement("div");
    tooltip.className = "tooltip";
    root.append(tooltip);

    const marks: Array<{ element: Element; mark: HTMLDivElement }> = [];

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

    for (const [element, group] of grouped) {
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
      marks.push({ element, mark });
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

        for (const { element, mark } of marks) {
          const rect = element.getBoundingClientRect();
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
