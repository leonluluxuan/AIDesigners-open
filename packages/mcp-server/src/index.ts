#!/usr/bin/env node
import { AIDesignerApiError, AIDesignerClient } from "@aidesigner/api-client";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

type JsonObject = Record<string, unknown>;
type ToolDefinition = {
  name: string;
  description: string;
  inputSchema: JsonObject;
  call: (input: JsonObject) => Promise<unknown>;
};

const objectSchema = (properties: JsonObject, required: string[] = []) => ({
  type: "object",
  properties,
  required,
  additionalProperties: false,
});
const string = (description: string) => ({ type: "string", description });

const client = new AIDesignerClient();
const idempotency = (input: JsonObject) => typeof input.idempotencyKey === "string" ? input.idempotencyKey : crypto.randomUUID();
const body = (input: JsonObject, omitted: string[] = []) => Object.fromEntries(Object.entries(input).filter(([key]) => !omitted.includes(key)));
const post = (path: string, input: JsonObject) => client.request("POST", path, { body: body(input, ["idempotencyKey"]), idempotencyKey: idempotency(input) });
const patch = (path: string, input: JsonObject) => client.request("PATCH", path, { body: body(input, ["idempotencyKey"]), idempotencyKey: idempotency(input) });

const tools: ToolDefinition[] = [
  {
    name: "account_get",
    description: "Read the current AIDesigner account balance and generation capabilities.",
    inputSchema: objectSchema({}),
    call: () => client.account(),
  },
  {
    name: "image_generate",
    description: "Submit one or more images for asynchronous generation. The prompt is authored by the calling agent; hosted private prompts are not returned.",
    inputSchema: objectSchema({ prompt: string("Complete user-facing generation prompt."), modelId: string("Optional public image model ID."), size: string("Aspect ratio."), preset: string("default, 2k, or 4k."), count: { type: "integer", minimum: 1, maximum: 8 }, referenceImageUrls: { type: "array", items: { type: "string" }, maxItems: 4 }, idempotencyKey: string("Stable retry key.") }, ["prompt"]),
    call: (input) => client.generateImage(body(input, ["idempotencyKey"]) as Parameters<typeof client.generateImage>[0], idempotency(input)),
  },
  {
    name: "image_status",
    description: "Poll an image generation task.",
    inputSchema: objectSchema({ taskId: string("Image task ID.") }, ["taskId"]),
    call: (input) => client.imageStatus(String(input.taskId)),
  },
  {
    name: "asset_upload_init",
    description: "Create a short-lived direct-upload intent for a video or ecommerce asset. Upload bytes to the returned URL, then call asset_upload_complete.",
    inputSchema: objectSchema({ domain: { type: "string", enum: ["video", "ecommerce"] }, filename: string("Original filename."), mimeType: string("Declared MIME type."), declaredBytes: { type: "integer", minimum: 1 }, projectId: string("Required when attaching a video asset to an existing project."), assetType: string("Video role such as source_video, product_image, model_image, or scene_image."), variantSlot: { type: "integer", minimum: 1 }, idempotencyKey: string("Stable retry key.") }, ["domain", "filename", "mimeType", "declaredBytes"]),
    call: (input) => input.domain === "video"
      ? post("video/assets/uploads", body(input, ["domain"]))
      : post("ecommerce/assets/uploads", {
          filename: input.filename,
          contentType: input.mimeType,
          bytes: input.declaredBytes,
          idempotencyKey: input.idempotencyKey,
        }),
  },
  {
    name: "asset_upload_complete",
    description: "Verify and complete a previously initialized direct upload.",
    inputSchema: objectSchema({ domain: { type: "string", enum: ["video", "ecommerce"] }, assetId: string("Asset ID returned by asset_upload_init."), idempotencyKey: string("Stable retry key.") }, ["domain", "assetId"]),
    call: (input) => post(`${input.domain === "video" ? "video" : "ecommerce"}/assets/${encodeURIComponent(String(input.assetId))}/complete`, body(input, ["domain", "assetId"])),
  },
  {
    name: "video_create_project",
    description: "Create a video-remake or one-click video project. This starts a multi-stage workflow and does not synchronously generate the final video.",
    inputSchema: objectSchema({ project: { type: "object", additionalProperties: true }, idempotencyKey: string("Stable retry key.") }, ["project"]),
    call: (input) => client.createVideoProject(input.project, idempotency(input)),
  },
  {
    name: "video_get_review",
    description: "Read a video project, its analysis, storyboard state, and public job summaries without private prompts or upstream IDs.",
    inputSchema: objectSchema({ projectId: string("Video project ID.") }, ["projectId"]),
    call: (input) => client.getVideoProject(String(input.projectId)),
  },
  {
    name: "video_add_source_link",
    description: "Resolve a TikTok or Instagram source URL into a project-owned source asset.",
    inputSchema: objectSchema({ projectId: string("Video project ID."), url: string("Source video URL."), idempotencyKey: string("Stable retry key.") }, ["projectId", "url"]),
    call: (input) => post(`video/projects/${encodeURIComponent(String(input.projectId))}/source-link`, body(input, ["projectId"])),
  },
  {
    name: "video_analyze",
    description: "Start source analysis and public remake-blueprint creation for a video project.",
    inputSchema: objectSchema({ projectId: string("Video project ID."), idempotencyKey: string("Stable retry key.") }, ["projectId"]),
    call: (input) => post(`video/projects/${encodeURIComponent(String(input.projectId))}/compile-blueprint`, body(input, ["projectId"])),
  },
  {
    name: "video_update_copy",
    description: "Apply a copy-only edit to a video variant. Visual locks remain enforced by the hosted workflow.",
    inputSchema: objectSchema({ variantId: string("Video variant ID."), blueprint: { type: "object", additionalProperties: true }, expectedVersion: { type: "integer" }, changeScope: { const: "copy" }, idempotencyKey: string("Stable retry key.") }, ["variantId", "blueprint", "expectedVersion", "changeScope"]),
    call: (input) => patch(`video/variants/${encodeURIComponent(String(input.variantId))}`, body(input, ["variantId"])),
  },
  {
    name: "video_create_source_frames",
    description: "Start exact source-frame-sheet extraction for a project or unit.",
    inputSchema: objectSchema({ projectId: string("Video project ID."), unitId: string("Optional timeline unit ID."), idempotencyKey: string("Stable retry key.") }, ["projectId"]),
    call: (input) => post(`video/projects/${encodeURIComponent(String(input.projectId))}/source-frame-sheet`, body(input, ["projectId"])),
  },
  {
    name: "video_generate_grids",
    description: "Generate storyboard grids from confirmed source evidence and reference roles.",
    inputSchema: objectSchema({ variantId: string("Video variant ID."), unitId: string("Optional timeline unit ID."), force: { type: "boolean" }, idempotencyKey: string("Stable retry key.") }, ["variantId"]),
    call: (input) => post(`video/variants/${encodeURIComponent(String(input.variantId))}/grids`, body(input, ["variantId"])),
  },
  {
    name: "video_confirm_variant",
    description: "Confirm the reviewed copy and storyboard revision before final generation.",
    inputSchema: objectSchema({ variantId: string("Video variant ID."), expectedVersion: { type: "integer" }, allowSpeechOver: { type: "boolean" }, idempotencyKey: string("Stable retry key.") }, ["variantId", "expectedVersion"]),
    call: (input) => post(`video/variants/${encodeURIComponent(String(input.variantId))}/confirm`, body(input, ["variantId"])),
  },
  {
    name: "video_generate",
    description: "Submit final asynchronous video generation for a confirmed variant or one approved unit.",
    inputSchema: objectSchema({ variantId: string("Video variant ID."), unitId: string("Optional timeline unit ID."), idempotencyKey: string("Stable retry key.") }, ["variantId"]),
    call: (input) => post(`video/variants/${encodeURIComponent(String(input.variantId))}/videos`, body(input, ["variantId"])),
  },
  {
    name: "job_status",
    description: "Poll a public video workflow job. jobType is analysis, source-frame, grid, video, depth, or pro-preparation.",
    inputSchema: objectSchema({ jobType: { type: "string", enum: ["analysis", "source-frame", "grid", "video", "depth", "pro-preparation"] }, jobId: string("Job ID.") }, ["jobType", "jobId"]),
    call: (input) => {
      const routes: Record<string, string> = { analysis: "analysis-jobs", "source-frame": "source-frame-jobs", grid: "grid-jobs", video: "jobs", depth: "depth-jobs", "pro-preparation": "pro-preparations" };
      return client.request("GET", `video/${routes[String(input.jobType)]}/${encodeURIComponent(String(input.jobId))}`);
    },
  },
  {
    name: "ecommerce_create_project",
    description: "Create an ecommerce image project from product references, facts, modules, and exact copy.",
    inputSchema: objectSchema({ project: { type: "object", additionalProperties: true }, idempotencyKey: string("Stable retry key.") }, ["project"]),
    call: (input) => client.createEcommerceProject(input.project, idempotency(input)),
  },
  {
    name: "ecommerce_get_project",
    description: "Read an ecommerce project and its public job summaries.",
    inputSchema: objectSchema({ projectId: string("Ecommerce project ID.") }, ["projectId"]),
    call: (input) => client.getEcommerceProject(String(input.projectId)),
  },
  {
    name: "ecommerce_generate_plan",
    description: "Start asynchronous evidence-based A+ module planning.",
    inputSchema: objectSchema({ projectId: string("Ecommerce project ID."), idempotencyKey: string("Stable retry key.") }, ["projectId"]),
    call: (input) => post(`ecommerce/projects/${encodeURIComponent(String(input.projectId))}/plan`, body(input, ["projectId"])),
  },
  {
    name: "ecommerce_update_plan",
    description: "Update a draft A+ plan while preserving evidence and module contracts.",
    inputSchema: objectSchema({ projectId: string("Ecommerce project ID."), blueprint: { type: "object", additionalProperties: true }, idempotencyKey: string("Stable retry key.") }, ["projectId", "blueprint"]),
    call: (input) => patch(`ecommerce/projects/${encodeURIComponent(String(input.projectId))}/plan`, body(input, ["projectId"])),
  },
  {
    name: "ecommerce_confirm_plan",
    description: "Confirm an A+ plan before any final module images are generated.",
    inputSchema: objectSchema({ projectId: string("Ecommerce project ID."), idempotencyKey: string("Stable retry key.") }, ["projectId"]),
    call: (input) => post(`ecommerce/projects/${encodeURIComponent(String(input.projectId))}/plan/confirm`, body(input, ["projectId"])),
  },
  {
    name: "ecommerce_generate_batch",
    description: "Submit confirmed ecommerce modules to the durable asynchronous batch queue.",
    inputSchema: objectSchema({ projectId: string("Ecommerce project ID."), batchId: string("Stable UUID batch ID."), moduleIds: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 8 }, idempotencyKey: string("Stable retry key.") }, ["projectId", "batchId", "moduleIds"]),
    call: (input) => post(`ecommerce/projects/${encodeURIComponent(String(input.projectId))}/generate-batch`, body(input, ["projectId"])),
  },
  {
    name: "try_on_generate",
    description: "Generate ecommerce try-on images from explicit model and product reference roles.",
    inputSchema: objectSchema({ request: { type: "object", additionalProperties: true }, idempotencyKey: string("Stable retry key.") }, ["request"]),
    call: (input) => client.request("POST", "ecommerce/try-on", { body: input.request, idempotencyKey: idempotency(input) }),
  },
];

const server = new Server({ name: "aidesigner", version: "0.1.0" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: tools.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = tools.find((candidate) => candidate.name === request.params.name);
  if (!tool) return { content: [{ type: "text", text: `Unknown tool: ${request.params.name}` }], isError: true };
  try {
    const result = await tool.call((request.params.arguments ?? {}) as JsonObject);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    const payload = error instanceof AIDesignerApiError
      ? { code: error.code, message: error.message, status: error.status, retryAfterSeconds: error.retryAfterSeconds }
      : { code: "AIDESIGNER_MCP_FAILED", message: error instanceof Error ? error.message : String(error) };
    return { content: [{ type: "text", text: JSON.stringify({ error: payload }, null, 2) }], isError: true };
  }
});

await server.connect(new StdioServerTransport());
