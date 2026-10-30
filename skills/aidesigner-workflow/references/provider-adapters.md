# Independent provider adapters

Independent mode requires explicit implementations of:

- `ImageProvider`;
- `VideoAnalysisProvider`;
- `VideoProvider`;
- `StorageProvider`;
- `JobStore`;
- authentication and authorization;
- billing or a deliberate no-billing policy;
- media inspection, retries, safety, and observability.

Use the interfaces in `packages/workflow-types`. Do not treat a model-provider key as an AIDesigner Agent Key or vice versa.

## Selection

Choose adapters based on required modalities, reference limits, duration and aspect-ratio support, asynchronous status APIs, content terms, geographic availability, and user budget. Verify current provider documentation before implementation.

## Minimum behavior

- Store durable asset IDs instead of expiring URLs.
- Persist jobs before or atomically with provider submission.
- Make retryable mutations idempotent.
- Normalize provider statuses into the public job states.
- Keep provider errors out of user-facing public DTOs unless they are already safe and actionable.
- Run the public conformance checks for timeline continuity, evidence linkage, quantity, confirmation, and response privacy.

Replacing adapters reproduces the public workflow shape. It does not reproduce private hosted prompts, routing, model-specific tokens, or quality tuning.
