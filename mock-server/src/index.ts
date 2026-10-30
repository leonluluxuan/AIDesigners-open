import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 4317);
const jobs = new Map<string, { polls: number; kind: string }>();

function json(response: import("node:http").ServerResponse, status: number, body: unknown) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "private, no-store",
    "X-AIDesigner-Workflow-Version": "aidesigner-workflow/v1",
  });
  response.end(JSON.stringify(body));
}

async function readJson(request: import("node:http").IncomingMessage) {
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of request) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += bytes.byteLength;
    if (total > 1024 * 1024) throw new Error("Request too large");
    chunks.push(bytes);
  }
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) as unknown : {};
}

createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);
  if (!url.pathname.startsWith("/api/agent/v1/")) return json(response, 404, { error: { code: "AGENT_ROUTE_NOT_FOUND", message: "Agent API route was not found." } });
  if (!/^Bearer aid_(?:test|live)_/.test(request.headers.authorization ?? "")) return json(response, 401, { error: { code: "AGENT_AUTH_REQUIRED", message: "A mock Agent API key is required." } });

  if (request.method === "GET" && url.pathname.endsWith("/account")) {
    return json(response, 200, { accountId: "mock-account", workflowVersion: "aidesigner-workflow/v1", membership: { credits: { total: 100 }, capabilities: { supportsBatch: true } } });
  }

  const taskMatch = url.pathname.match(/\/images\/([^/]+)$/);
  if (request.method === "GET" && taskMatch) {
    const job = jobs.get(taskMatch[1]!);
    if (!job) return json(response, 404, { error: { code: "TASK_NOT_FOUND", message: "Mock task not found." } });
    job.polls += 1;
    return json(response, 200, job.polls > 1
      ? { taskId: taskMatch[1], status: "completed", progress: 100, imageUrls: ["https://example.invalid/mock-result.png"] }
      : { taskId: taskMatch[1], status: "processing", progress: 50, imageUrls: [] });
  }

  if (request.method === "POST" && url.pathname.endsWith("/images/generate")) {
    await readJson(request);
    const taskId = crypto.randomUUID();
    jobs.set(taskId, { polls: 0, kind: "image" });
    return json(response, 202, { taskIds: [taskId], status: "submitted", creditsCharged: 1, remainingCredits: 99 });
  }

  if (request.method === "GET") return json(response, 200, { status: "completed", project: { id: "mock-project" }, jobs: [] });
  await readJson(request).catch(() => ({}));
  return json(response, 202, { id: crypto.randomUUID(), status: "queued" });
}).listen(port, "127.0.0.1", () => {
  process.stdout.write(`AIDesigner mock server listening on http://127.0.0.1:${port}\n`);
});
