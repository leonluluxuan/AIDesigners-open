import type {
  AssetRef,
  ImageGenerateInput,
  ImageProvider,
  JobRef,
  JobStatus,
  VideoAnalysisProvider,
  VideoProvider,
  VideoRemakePlan,
} from "@aidesigner/workflow-types";

// This example is deliberately provider-neutral. Replace only the marked
// methods with calls to services you are authorized to use. Do not copy
// credentials into source control.
export class IndependentImageProvider implements ImageProvider {
  async generate(_input: ImageGenerateInput): Promise<JobRef> {
    throw new Error("Connect your image provider here.");
  }

  async getStatus(_jobId: string): Promise<JobRef & { assets?: AssetRef[] }> {
    throw new Error("Connect your image provider status API here.");
  }
}

export class IndependentVideoAnalysisProvider implements VideoAnalysisProvider {
  async analyze(_input: Parameters<VideoAnalysisProvider["analyze"]>[0]): Promise<VideoRemakePlan> {
    throw new Error("Implement the public evidence and timeline contract here.");
  }
}

export class IndependentVideoProvider implements VideoProvider {
  async generate(_input: Parameters<VideoProvider["generate"]>[0]): Promise<JobRef> {
    throw new Error("Connect your video provider here.");
  }

  async getStatus(_jobId: string): Promise<JobRef & { asset?: AssetRef }> {
    const status: JobStatus = "failed";
    return { jobId: _jobId, status };
  }
}
