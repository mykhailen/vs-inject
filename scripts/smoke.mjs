// Verifies the published shape: both `exports` conditions resolve via the
// package's own name (Node self-reference) and the API works from each.
import { createRequire } from "node:module";
import assert from "node:assert/strict";

const require = createRequire(import.meta.url);
const cjs = require("vs-inject");
const esm = await import("vs-inject");

for (const [name, mod] of [["cjs", cjs], ["esm", esm]]) {
  assert.equal(typeof mod.Container, "function", `${name}: Container export`);
  assert.equal(typeof mod.token, "function", `${name}: token export`);
  assert.equal(typeof mod.Inject, "function", `${name}: Inject export`);
  const c = new mod.Container();
  const N = mod.token("n");
  c.register(N, () => 42);
  assert.equal(c.get(N), 42, `${name}: register/get round-trip`);
  assert.throws(() => c.get(mod.token("missing")), /vs-inject: no factory registered for "missing"/);
}
console.log("smoke ok: cjs + esm");
