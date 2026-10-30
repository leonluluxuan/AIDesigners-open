# Tool contract

## Hosted tools

| Tool | Result |
|---|---|
| `account_get` | credits and capability summary |
| `image_generate` | submitted image task IDs |
| `image_status` | status, progress, public result URLs |
| `asset_upload_init` | short-lived direct-upload URL and required headers |
| `asset_upload_complete` | verified project-owned asset |
| `video_create_project` | project ID and initial state |
| `video_add_source_link` | verified source asset |
| `video_analyze` | analysis job or review state |
| `video_create_source_frames` | source-frame job |
| `video_generate_grids` | storyboard jobs |
| `video_get_review` | public project, analysis, variants, assets, jobs |
| `video_update_copy` | new copy revision |
| `video_confirm_variant` | immutable confirmed revision |
| `video_generate` | final video jobs |
| `job_status` | public status for a named job type |
| `ecommerce_create_project` | ecommerce project |
| `ecommerce_get_project` | project and public batch jobs |
| `ecommerce_generate_plan` | asynchronous A+ plan state |
| `ecommerce_update_plan` | updated draft plan |
| `ecommerce_confirm_plan` | confirmed plan |
| `ecommerce_generate_batch` | durable batch acceptance |
| `try_on_generate` | try-on batch result or jobs |

For an upload, send the exact local file bytes to the returned URL with the returned headers, then call `asset_upload_complete`. Treat the upload URL as short-lived secret-bearing transport state: do not put it in a plan, commit, log, or durable project record.

## Idempotency

Use one stable idempotency key for retries of the same logical JSON mutation. Hosted mode retains the sanitized public response for 24 hours. Generate a new key when the user changes the requested operation, and never reuse one key for different request bodies.

## Errors

- `401`: missing, invalid, revoked, or expired Agent Key;
- `403`: missing scope or account capability;
- `409`: confirmation, revision, lock, or idempotency conflict;
- `410`: expired temporary reference;
- `422`: invalid structured plan or unsupported combination;
- `429`: back off using `Retry-After` when present;
- `5xx`: do not expose or infer internal provider details; retry only when the operation is idempotent.

## Public-response boundary

Hosted tools must not return private prompts, compiled prompts, provider payloads, provider task IDs, internal storage keys, billing record IDs, or raw service errors.
