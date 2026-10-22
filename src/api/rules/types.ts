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

export type Reference =
  | { type: "file"; path: string; line: number; column: number; source: string }
  | { type: "element"; selector: string; source: string };

export type MatchResult =
  | { matches: false }
  | { matches: true; explanation: string; references?: readonly Reference[] };

export type Rule = {
  id: string;
  title: string;
  description: string;
  match(context: RuleContext): MatchResult | Promise<MatchResult>;
};
