import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

import type { Page } from "puppeteer-core";

export type File = { path: string; content: string };

export type FileMatch = {
  path: string;
  content: string;
  index: number;
  match: string;
};

export type Files = {
  all(): readonly File[];
  get(path: string): File | undefined;
  search(query: string | RegExp): FileMatch[];
};

export type PuppeteerContext = {
  type: "puppeteer";
  page: Page;
};

export type FilesContext = {
  type: "files";
  files: Files;
};

export type RuleContext = PuppeteerContext | FilesContext;

export type Rule = {
  title: string;
  description: string;
  match(context: RuleContext): boolean | Promise<boolean>;
  generateExplanation(context: RuleContext): string | Promise<string>;
};

export function defineRule(rule: Rule): Rule {
  return rule;
}

export function createFiles(files: File[]): Files {
  const byPath = new Map(files.map((file) => [file.path, file]));

  return {
    all: () => files,
    get: (path) => byPath.get(path),
    search(query) {
      const matches: FileMatch[] = [];

      for (const file of files) {
        const pattern = query instanceof RegExp
          ? new RegExp(query.source, `${query.flags.replace("y", "")}${query.flags.includes("g") ? "" : "g"}`)
          : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");

        for (const match of file.content.matchAll(pattern)) {

          matches.push({
            path: file.path,
            content: file.content,
            index: match.index ?? 0,
            match: match[0],
          });
        }
      }
      
      return matches;
    },
  };
}

export async function readFiles(root: string): Promise<Files> {
  const files: File[] = [];

  async function visit(directory: string): Promise<void> {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);

      if (entry.isDirectory()) {
        await visit(path);
        continue;
      }

      if (entry.isFile()) {
        files.push({ path: relative(root, path), content: await readFile(path, "utf8") });
      }
    }
  }

  await visit(root);

  return createFiles(files);
}
