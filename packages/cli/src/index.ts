#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { AIDesignerApiError, AIDesignerClient } from "@aidesigner/api-client";

type Flags = Record<string, string | boolean>;

function parse(argv: string[]) {
  const positionals: string[] = [];
  const flags: Flags = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index]!;
    if (!value.startsWith("--")) {
      positionals.push(value);
      continue;
    }
    const [rawName, inline] = value.slice(2).split("=", 2);
    const next = argv[index + 1];
    if (inline !== undefined) flags[rawName!] = inline;
    else if (next && !next.startsWith("--")) {
      flags[rawName!] = next;
      index += 1;
    } else flags[rawName!] = true;
  }
  return { positionals, flags };
}

async function input(flags: Flags) {
  const path = typeof flags.input === "string" ? flags.input : "";
  if (!path) return {};
  return JSON.parse(await readFile(path, "utf8")) as unknown;
}

function idempotency(flags: Flags) {
  return typeof flags.idempotency === "string" ? flags.idempotency : crypto.randomUUID();
}

function help() {
  process.stdout.write(`AIDesigner CLI

Usage:
  aidesigner account
  aidesigner image generate --input request.json
  aidesigner image status TASK_ID
  aidesigner image download TASK_ID --index 0 --output image.png
  aidesigner video list
  aidesigner video create --input project.json
  aidesigner video get PROJECT_ID
  aidesigner video action ACTION ID [--input body.json]
  aidesigner ecommerce list
  aidesigner ecommerce create --input project.json
  aidesigner ecommerce get PROJECT_ID
  aidesigner ecommerce action ACTION ID [--input body.json]
  aidesigner request METHOD PATH [--input body.json]

Video actions:
  source-link, analyze, copy, source-frames, grids, confirm, generate,
  project-update, variant-update, job, analysis-job, frame-job, grid-job

Ecommerce actions:
  plan, plan-update, confirm, generate, try-on
`);
}

async function main() {
  const { positionals, flags } = parse(process.argv.slice(2));
  const [domain, command, id] = positionals;
  if (!domain || domain === "help" || flags.help) return help();
  const client = new AIDesignerClient();
  let result: unknown;

  if (domain === "account") result = await client.account();
  else if (domain === "image" && command === "generate") result = await client.generateImage(await input(flags) as Parameters<typeof client.generateImage>[0], idempotency(flags));
  else if (domain === "image" && command === "status" && id) result = await client.imageStatus(id);
  else if (domain === "image" && command === "download" && id) {
    const response = await client.downloadImage(id, Number(flags.index ?? 0));
    const output = typeof flags.output === "string" ? flags.output : `aidesigner-${id}.png`;
    await writeFile(output, new Uint8Array(await response.arrayBuffer()));
    result = { output, bytes: Number(response.headers.get("content-length") ?? 0) || undefined };
  } else if (domain === "video" && command === "list") result = await client.listVideoProjects();
  else if (domain === "video" && command === "create") result = await client.createVideoProject(await input(flags), idempotency(flags));
  else if (domain === "video" && command === "get" && id) result = await client.getVideoProject(id);
  else if (domain === "video" && command === "action" && positionals[2] && positionals[3]) {
    const action = positionals[2];
    const actionId = positionals[3];
    const body = await input(flags);
    const table: Record<string, [string, string]> = {
      "source-link": ["POST", `video/projects/${actionId}/source-link`],
      analyze: ["POST", `video/projects/${actionId}/compile-blueprint`],
      copy: ["POST", `video/projects/${actionId}/compile-copy`],
      "source-frames": ["POST", `video/projects/${actionId}/source-frame-sheet`],
      grids: ["POST", `video/variants/${actionId}/grids`],
      confirm: ["POST", `video/variants/${actionId}/confirm`],
      generate: ["POST", `video/variants/${actionId}/videos`],
      "project-update": ["PATCH", `video/projects/${actionId}`],
      "variant-update": ["PATCH", `video/variants/${actionId}`],
      job: ["GET", `video/jobs/${actionId}`],
      "analysis-job": ["GET", `video/analysis-jobs/${actionId}`],
      "frame-job": ["GET", `video/source-frame-jobs/${actionId}`],
      "grid-job": ["GET", `video/grid-jobs/${actionId}`],
    };
    const target = action ? table[action] : undefined;
    if (!target) throw new Error("Unknown video action.");
    result = await client.request(target[0], target[1], { body: target[0] === "GET" ? undefined : body, idempotencyKey: idempotency(flags) });
  } else if (domain === "ecommerce" && command === "list") result = await client.listEcommerceProjects();
  else if (domain === "ecommerce" && command === "create") result = await client.createEcommerceProject(await input(flags), idempotency(flags));
  else if (domain === "ecommerce" && command === "get" && id) result = await client.getEcommerceProject(id);
  else if (domain === "ecommerce" && command === "action" && positionals[2] && positionals[3]) {
    const action = positionals[2];
    const actionId = positionals[3];
    const body = await input(flags);
    const table: Record<string, [string, string]> = {
      plan: ["POST", `ecommerce/projects/${actionId}/plan`],
      "plan-update": ["PATCH", `ecommerce/projects/${actionId}/plan`],
      confirm: ["POST", `ecommerce/projects/${actionId}/plan/confirm`],
      generate: ["POST", `ecommerce/projects/${actionId}/generate-batch`],
      "try-on": ["POST", "ecommerce/try-on"],
    };
    const target = action ? table[action] : undefined;
    if (!target) throw new Error("Unknown ecommerce action.");
    result = await client.request(target[0], target[1], { body, idempotencyKey: idempotency(flags) });
  } else if (domain === "request" && command && id) {
    result = await client.request(command.toUpperCase(), id, { body: command.toUpperCase() === "GET" ? undefined : await input(flags), idempotencyKey: idempotency(flags) });
  } else {
    help();
    process.exitCode = 2;
    return;
  }

  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  if (error instanceof AIDesignerApiError) {
    process.stderr.write(`${error.code}: ${error.message}\n`);
    process.exitCode = error.status === 401 || error.status === 403 ? 3 : error.status === 429 ? 4 : 1;
    return;
  }
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
