# Ecommerce workflow

## Stages

```text
product references → evidence/facts → module contract → exact copy
→ visual plan → review/confirmation → durable batch generation → result review
```

Virtual try-on uses the same evidence rules but assigns separate model and product reference roles.

## Evidence rules

- Treat product photographs and user-supplied fact sheets as evidence.
- Do not infer certifications, measurements, materials, compatibility, medical benefits, prices, or performance claims from appearance alone.
- Keep exact user-approved copy separate from generated visual direction.
- Preserve product count, package contents, label geometry, and visible variants unless explicitly changed.

## A+ planning

Create a structured module plan before image generation. Each module records its purpose, evidence IDs, exact copy when required, reference roles, and product quantity. The plan is reviewable; it is not a final image prompt.

Hosted mode uses `ecommerce_create_project`, `ecommerce_generate_plan`, `ecommerce_get_project`, optional `ecommerce_update_plan`, `ecommerce_confirm_plan`, and `ecommerce_generate_batch`. Batch generation remains asynchronous and must be polled through the project state.

## Try-on

Use exactly one person/model authority and one or more explicit product authorities. Preserve the model's identity and the product's silhouette, material, color, hardware, logos, and quantity. A style reference may change treatment but not product identity.
