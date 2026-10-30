# Image workflow

## Stages

```text
user intent → image type → reference roles → agent-authored generation prompt
→ asynchronous provider job → result review → download
```

## Planning rules

1. Identify whether the request is text-to-image, reference-guided editing, product photography, character reference, layout/design, or a variation set.
2. Assign each reference a role and state what it may control.
3. Write a task-specific prompt from the user's brief. Do not claim it is AIDesigner's private production prompt.
4. State hard constraints before aesthetic preferences: identity, quantity, copy, geometry, dimensions, forbidden changes.
5. Request the smallest output count that satisfies the task; expand only after reviewing an initial result.

## Hosted execution

Use `image_generate`, then poll `image_status`. Use an upload tool when a reference must first be placed in hosted storage. Download through the public result endpoint instead of reusing an upstream provider URL.

## Review

Check product count, identity, copy accuracy, aspect ratio, visible defects, reference leakage, and forbidden additions. Retry only with a concrete correction.
