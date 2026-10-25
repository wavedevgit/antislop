export { parseArguments } from "./config/index.ts";

export type { DetectorConfig } from "./config/index.ts";

export { withContext } from "./context/index.ts";

export { detect } from "./detector/index.ts";

export type { Finding } from "./detector/index.ts";

export { screenshotProblemReport, screenshotVisualFindings, showVisualFindings } from "./visualizer/index.ts";

export { createFiles, defineRule, readFiles } from "./rules/index.ts";

export type {
  File,
  FileMatch,
  Files,
  FilesContext,
  MatchResult,
  PuppeteerContext,
  Reference,
  Rule,
  RuleContext,
} from "./rules/index.ts";
