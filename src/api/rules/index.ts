import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";

import type { File, FileMatch, Files, Rule } from "./types.ts";

export type * from "./types.ts";

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
