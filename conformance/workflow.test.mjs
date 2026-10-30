import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { WORKFLOW_VERSION } from "../packages/workflow-types/dist/index.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("all public schemas are valid JSON and carry stable IDs", async () => {
  const files = (await readdir(path.join(root, "schemas"))).filter((file) => file.endsWith(".json"));
  assert.ok(files.length >= 4);
  for (const file of files) {
    const schema = JSON.parse(await readFile(path.join(root, "schemas", file), "utf8"));
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.match(schema.$id, /^https:\/\/aidesigners\.art\/schemas\//);
  }
});

test("video example has continuous time, evidence-backed frames, and confirmation", async () => {
  const plan = JSON.parse(await readFile(path.join(root, "examples/video-remake-plan.json"), "utf8"));
  assert.equal(plan.schemaVersion, WORKFLOW_VERSION);
  assert.equal(plan.requiresConfirmation, true);
  assert.equal(plan.units[0].startSec, 0);
  assert.equal(plan.units.at(-1).endSec, plan.sourceDurationSec);
  for (let index = 1; index < plan.units.length; index += 1) {
    assert.equal(plan.units[index - 1].endSec, plan.units[index].startSec);
  }
  const evidence = new Set(plan.evidence.map((item) => item.id));
  for (const frame of plan.frames) {
    assert.ok(Number.isFinite(frame.sourceTimestampSec));
    assert.ok(frame.evidenceIds.length > 0);
    assert.ok(frame.evidenceIds.every((id) => evidence.has(id)));
  }
  assert.ok(plan.units.every((unit) => unit.productQuantity === 1));
});

test("public repository contains adapters and clients, not hosted prompt compilers", async () => {
  const forbiddenNames = new Set([
    "blueprint-compiler.ts",
    "grid-prompt-renderer.ts",
    "video-prompt-compiler.ts",
    "prompt-registry.server.ts",
    "prompt-compiler.server.ts",
    "try-on-prompt.server.ts",
    "pro-remake-copy.ts",
  ]);
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.name === "node_modules" || entry.name === "dist" || entry.name === ".git") continue;
      if (entry.isDirectory()) await walk(full);
      else assert.equal(forbiddenNames.has(entry.name), false, `Private hosted file leaked: ${full}`);
    }
  }
  await walk(root);
});

test("Skill routes hosted and independent execution without claiming identical results", async () => {
  const skill = await readFile(path.join(root, "skills/aidesigner-workflow/SKILL.md"), "utf8");
  assert.match(skill, /Hosted mode/);
  assert.match(skill, /Independent mode/);
  assert.match(skill, /never promise pixel-identical/i);
  assert.match(skill, /references\/video-remake-workflow\.md/);
});

test("hosted mutation clients carry idempotency keys through CLI and MCP", async () => {
  const client = await readFile(path.join(root, "packages/api-client/src/index.ts"), "utf8");
  const cli = await readFile(path.join(root, "packages/cli/src/index.ts"), "utf8");
  const mcp = await readFile(path.join(root, "packages/mcp-server/src/index.ts"), "utf8");
  assert.match(client, /generateImage\(input: ImageGenerateInput, idempotencyKey/);
  assert.match(cli, /generateImage\([^\n]+idempotency\(flags\)\)/);
  assert.match(mcp, /client\.generateImage\([^\n]+idempotency\(input\)\)/);
});

test("Codex and Claude Code setup examples forward secrets instead of embedding them", async () => {
  const readme = await readFile(path.join(root, "README.md"), "utf8");
  const claudeConfig = JSON.parse(await readFile(path.join(root, ".mcp.json.example"), "utf8"));
  assert.match(readme, /env_vars = \["AIDESIGNER_API_KEY", "AIDESIGNER_BASE_URL"\]/);
  assert.equal(claudeConfig.mcpServers.aidesigner.env.AIDESIGNER_API_KEY, "${AIDESIGNER_API_KEY}");
  assert.doesNotMatch(readme, /aid_live_[0-9a-f]{64}/);
});

test("ecommerce direct-upload tool maps the public fields to the hosted contract", async () => {
  const mcp = await readFile(path.join(root, "packages/mcp-server/src/index.ts"), "utf8");
  assert.match(mcp, /contentType: input\.mimeType/);
  assert.match(mcp, /bytes: input\.declaredBytes/);
});
