import type { AccountSummary, ImageGenerateInput } from "@aidesigner/workflow-types";

export type ClientOptions = {
  baseUrl?: string;
  apiKey?: string;
  fetch?: typeof fetch;
};

export type RequestOptions = {
  body?: unknown;
  headers?: Record<string, string>;
  idempotencyKey?: string;
};

export class AIDesignerApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "AIDesignerApiError";
  }
}

function normalizedBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

export class AIDesignerClient {
  readonly baseUrl: string;
  readonly apiKey: string;
  readonly fetcher: typeof fetch;

  constructor(options: ClientOptions = {}) {
    this.baseUrl = normalizedBaseUrl(options.baseUrl ?? process.env.AIDESIGNER_BASE_URL ?? "https://aidesigners.art");
    this.apiKey = options.apiKey ?? process.env.AIDESIGNER_API_KEY ?? "";
    this.fetcher = options.fetch ?? fetch;
    if (!this.apiKey) throw new Error("AIDESIGNER_API_KEY is required.");
  }

  async request<T = unknown>(method: string, path: string, options: RequestOptions = {}): Promise<T> {
    const headers = new Headers(options.headers);
    headers.set("Authorization", `Bearer ${this.apiKey}`);
    headers.set("Accept", "application/json");
    if (options.idempotencyKey) headers.set("Idempotency-Key", options.idempotencyKey);
    let body: BodyInit | undefined;
    if (options.body instanceof FormData || options.body instanceof Blob || typeof options.body === "string") {
      body = options.body;
    } else if (options.body !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.body);
    }
    const response = await this.fetcher(`${this.baseUrl}/api/agent/v1/${path.replace(/^\/+/, "")}`, {
      method,
      headers,
      body,
      cache: "no-store",
    });
    const payload = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null;
    if (!response.ok) {
      const retryAfter = Number(response.headers.get("retry-after"));
      throw new AIDesignerApiError(
        payload?.error?.code ?? "AIDESIGNER_REQUEST_FAILED",
        payload?.error?.message ?? `AIDesigner returned HTTP ${response.status}.`,
        response.status,
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
      );
    }
    return payload as T;
  }

  account() { return this.request<AccountSummary>("GET", "account"); }
  generateImage(input: ImageGenerateInput, idempotencyKey: string = crypto.randomUUID()) {
    return this.request("POST", "images/generate", { body: input, idempotencyKey });
  }
  imageStatus(taskId: string) { return this.request("GET", `images/${encodeURIComponent(taskId)}`); }
  listVideoProjects() { return this.request("GET", "video/projects"); }
  createVideoProject(input: unknown, idempotencyKey: string = crypto.randomUUID()) {
    return this.request("POST", "video/projects", { body: input, idempotencyKey });
  }
  getVideoProject(projectId: string) { return this.request("GET", `video/projects/${encodeURIComponent(projectId)}`); }
  listEcommerceProjects() { return this.request("GET", "ecommerce/projects"); }
  createEcommerceProject(input: unknown, idempotencyKey: string = crypto.randomUUID()) {
    return this.request("POST", "ecommerce/projects", { body: input, idempotencyKey });
  }
  getEcommerceProject(projectId: string) { return this.request("GET", `ecommerce/projects/${encodeURIComponent(projectId)}`); }

  async downloadImage(taskId: string, index = 0) {
    const response = await this.fetcher(`${this.baseUrl}/api/agent/v1/images/${encodeURIComponent(taskId)}/download?index=${index}`, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
      cache: "no-store",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: { code?: string; message?: string } } | null;
      throw new AIDesignerApiError(payload?.error?.code ?? "IMAGE_DOWNLOAD_FAILED", payload?.error?.message ?? "Image download failed.", response.status);
    }
    return response;
  }
}
