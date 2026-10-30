---
name: aidesigner-workflow
description: Plan and execute AIDesigner image generation, evidence-based video remake, ecommerce imagery, and virtual try-on through the hosted AIDesigner MCP/CLI or compatible independent provider adapters. Use when an agent must turn user references and facts into a staged, reviewable media workflow; do not use for ordinary prose-only requests.
---

# AIDesigner Workflow

Use the user's intent, references, product facts, budget, and requested output as the source of truth. Preserve explicit quantities, identities, copy, language, aspect ratio, and forbidden claims.

## Choose execution mode

### Hosted mode

Use available `aidesigner` MCP tools first. If they are unavailable, use the `aidesigner` CLI. Hosted execution uses the user's AIDesigner Agent API Key and AIDesigner credits. Never ask the user to paste a key into generated source, a workflow document, or chat output; use the client environment's secret configuration.

Hosted mode keeps production prompt compilers, provider routing, billing, storage, and retries on AIDesigner's service. Do not attempt to retrieve or reconstruct hidden server prompts.

### Independent mode

Use compatible image, video-analysis, video-generation, storage, and job-store adapters supplied by the user. Read [references/provider-adapters.md](references/provider-adapters.md) before selecting tools or asking for provider configuration.

Independent mode implements the public workflow, not AIDesigner's private tuning. State this when result equivalence matters, and never promise pixel-identical or behavior-identical output.

If neither hosted tools nor independent adapters are available, produce a structured plan and list the missing execution capability instead of claiming generation succeeded.

## Route by task

- For general image creation or reference-guided editing, read [references/image-workflow.md](references/image-workflow.md).
- For source-video analysis, remake, storyboard, copy replacement, or final video, read [references/video-remake-workflow.md](references/video-remake-workflow.md).
- For product modules, A+ plans, product sets, marketing images, or virtual try-on, read [references/ecommerce-workflow.md](references/ecommerce-workflow.md).
- For tool names, asynchronous polling, errors, and confirmation boundaries, read [references/tool-contract.md](references/tool-contract.md).
- Before approving a final result, apply [references/quality-rubric.md](references/quality-rubric.md).

Read [references/workflow-overview.md](references/workflow-overview.md) when a task spans more than one media workflow or when execution mode is unclear.

## Non-negotiable invariants

- Assign every reference an explicit role: source video, source-frame sheet, product, person, scene, or style.
- Do not invent product claims, specifications, prices, certifications, or usage facts.
- Preserve product quantity unless the user explicitly changes it.
- Keep source evidence and generated assumptions distinguishable.
- Treat video remake as a multi-stage asynchronous workflow, never one synchronous call.
- Require review and confirmation before final video or confirmed ecommerce batch generation.
- Poll jobs with backoff; do not create a request storm.
- Do not persist short-lived signed URLs as durable project state.
- Do not expose private prompts, upstream provider task IDs, internal storage keys, or billing record IDs.
