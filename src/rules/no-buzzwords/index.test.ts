import assert from "node:assert/strict";
import test from "node:test";

import { createFiles } from "../../api/index.ts";
import rule from "./index.ts";

test("flags the banned buzzwords without matching parts of longer words", async () => {
  const files = createFiles([{
    path: "index.html",
    content: "Seamless and BLAZING. Made with love. Seamlessly homemade with lovely details.",
  }]);

  const result = await rule.match({ type: "files", files });

  assert.equal(result.matches, true);
  assert.equal(result.matches && result.references?.length, 3);
});
