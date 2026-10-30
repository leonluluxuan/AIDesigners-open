export const WORKFLOW_VERSION = "aidesigner-workflow/v1" as const;

export type WorkflowVersion = typeof WORKFLOW_VERSION;
export type JobStatus = "queued" | "processing" | "running" | "awaiting_review" | "completed" | "failed" | "cancelled";

export type PublicError = {
  code: string;
  message: string;
  retryable?: boolean;
  details?: Record<string, unknown>;
};

export type JobRef = {
  jobId: string;
  status: JobStatus;
  progress?: number;
};

export type AssetRef = {
  assetId: string;
  mediaType?: "image" | "video" | "audio" | "document";
  mimeType?: string;
  expiresAt?: string | null;
};

export type DownloadRef = {
  assetId: string;
  downloadUrl: string;
  expiresAt?: string | null;
};

export type ReferenceRole = "source_video" | "source_frame_sheet" | "product" | "person" | "scene" | "style";

export type ReferenceInput = AssetRef & {
  role: ReferenceRole;
  priority?: "primary" | "supporting";
  notes?: string;
};

export type ImageGenerateInput = {
  prompt: string;
  modelId?: string;
  size?: "auto" | "21:9" | "16:9" | "3:2" | "4:3" | "1:1" | "3:4" | "2:3" | "9:16";
  preset?: "default" | "2k" | "4k";
  count?: number;
  referenceImageUrls?: string[];
};

export type SourceEvidence = {
  id: string;
  sourceTimestampSec?: number;
  sourceAssetId?: string;
  description: string;
};

export type TimelineUnit = {
  id: string;
  startSec: number;
  endSec: number;
  evidenceIds: string[];
  intent: string;
  dialogue?: string;
  productQuantity?: number;
};

export type StoryboardFrame = {
  id: string;
  unitId: string;
  sourceTimestampSec: number;
  evidenceIds: string[];
  shotPurpose: string;
  referenceRoles: ReferenceRole[];
};

export type VideoRemakePlan = {
  schemaVersion: WorkflowVersion;
  sourceDurationSec: number;
  units: TimelineUnit[];
  frames: StoryboardFrame[];
  evidence: SourceEvidence[];
  claims: Array<{ text: string; evidenceId: string }>;
  requiresConfirmation: true;
};

export type EcommerceModulePlan = {
  moduleId: string;
  purpose: string;
  exactCopy?: string;
  evidenceIds: string[];
  referenceRoles: ReferenceRole[];
  productQuantity: number;
};

export type AccountSummary = {
  accountId: string;
  workflowVersion: WorkflowVersion;
  membership: unknown;
};

export interface ImageProvider {
  generate(input: ImageGenerateInput): Promise<JobRef>;
  getStatus(jobId: string): Promise<JobRef & { assets?: AssetRef[]; error?: PublicError }>;
}

export interface VideoAnalysisProvider {
  analyze(input: { source: AssetRef; references: ReferenceInput[]; facts: Record<string, unknown> }): Promise<VideoRemakePlan>;
}

export interface VideoProvider {
  generate(input: { plan: VideoRemakePlan; approvedAssetIds: string[]; options?: Record<string, unknown> }): Promise<JobRef>;
  getStatus(jobId: string): Promise<JobRef & { asset?: AssetRef; error?: PublicError }>;
}

export interface StorageProvider {
  createUpload(input: { filename: string; mimeType: string; bytes: number; role: ReferenceRole }): Promise<{ asset: AssetRef; uploadUrl: string; headers?: Record<string, string> }>;
  completeUpload(assetId: string): Promise<AssetRef>;
  createDownload(assetId: string): Promise<DownloadRef>;
}

export interface JobStore {
  put(job: JobRef): Promise<void>;
  get(jobId: string): Promise<JobRef | null>;
}
