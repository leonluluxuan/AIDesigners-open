# Workflow overview

## Inputs

Collect only information that changes the workflow:

- intended audience and channel;
- output type, aspect ratio, duration or dimensions;
- product facts and forbidden claims;
- source video or visual references;
- product, person, scene, and style references;
- exact copy or language requirements;
- acceptable cost, quality, and review requirements.

Do not ask for provider credentials when hosted mode is selected. Do not require every optional field before starting; create a draft and mark genuinely blocking gaps.

## Shared stages

```text
intent → evidence → structured plan → user review → asynchronous generation
→ result validation → downloadable assets
```

Each stage must leave a public artifact that another agent can inspect without a hidden prompt: a fact set, timeline, module plan, storyboard, job status, or asset reference.

## Reference authority

Use these roles consistently:

| Role | Authority |
|---|---|
| `source_video` | temporal structure, motion, pacing, source copy |
| `source_frame_sheet` | exact shot anchors and frame-to-frame visual evidence |
| `product` | product identity, geometry, material, label, visible quantity |
| `person` | identity, face, body, wardrobe, or presenter continuity |
| `scene` | environment and spatial layout |
| `style` | palette, lighting, typography, texture, or treatment only |

Do not let a style reference override product identity or factual evidence.

## Hosted versus independent output

Hosted mode returns sanitized public DTOs and short-lived result access. Independent mode should use the same public schemas and invariant checks. Either mode may produce different pixels or timing because providers and private tuning differ.
