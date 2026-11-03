# AIDesigner Open Workflow

Public workflow contracts and local tooling for agent-driven image creation, evidence-based video remake, ecommerce imagery, and virtual try-on.

中文简介： [README.zh-CN.md](README.zh-CN.md)

This repository is the public integration layer for AIDesigner. It contains the workflow Skill, provider-neutral TypeScript contracts, JSON Schemas, a hosted Agent API client, a CLI, a local MCP server, a mock server, and an independent provider-adapter interface.

It intentionally does **not** contain AIDesigner's production prompt compilers, private prompts, provider credentials, billing implementation, database internals, or hosted orchestration code.

## What this repository provides

- A stable public workflow version: `aidesigner-workflow/v1`.
- Evidence-backed plans for image, video-remake, ecommerce, and virtual try-on workflows.
- An asynchronous job model with explicit review and confirmation boundaries.
- A TypeScript API client, command-line interface, and stdio MCP server.
- JSON Schemas and examples that can be used by other agents and implementations.
- Independent-mode interfaces for teams that want to supply their own models, storage, and job system.
- A local mock server and conformance tests for integration development.

## Execution modes

### Hosted mode

```text
Claude Code / Codex
  → AIDesigner Skill
  → local MCP server or CLI
  → AIDesigner Agent API
  → private hosted workflow
```

Hosted mode uses an AIDesigner Agent API Key created from the user's AIDesigner account. Generation consumes that account's AIDesigner credits. The key is not an OpenAI, Gemini, Kling, MiniMax, or other model-provider key.

### Independent mode

```text
Claude Code / Codex
  → AIDesigner Skill
  → compatible provider adapters
  → the user's own models, storage, and job system
```

Independent implementations can reproduce the public workflow and output contracts, but they do not receive AIDesigner's private prompt wording, model routing, exception handling, or tuning. Providers may therefore produce different images, videos, timing, or behavior; identical results are not promised.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- For hosted mode: an AIDesigner Agent API Key
- For independent mode: implementations of the required provider, storage, and job interfaces

## Install, build, and test

```bash
npm ci
npm run build
npm test
```

The build emits ignored `dist/` directories inside each package. `npm test` rebuilds the workspaces and runs the public conformance suite.

## Use the CLI

Build first, then run the compiled entrypoint from the repository root:

```bash
export AIDESIGNER_API_KEY=aid_live_replace_me
export AIDESIGNER_BASE_URL=https://aidesigners.art

node packages/cli/dist/index.js account
node packages/cli/dist/index.js image generate --input examples/image-request.json
node packages/cli/dist/index.js image status TASK_ID
node packages/cli/dist/index.js video create --input examples/video-remake-plan.json
node packages/cli/dist/index.js ecommerce create --input examples/ecommerce-module-plan.json
```

For a full command list:

```bash
node packages/cli/dist/index.js help
```

The CLI prints JSON responses to stdout and uses non-zero exit codes for authentication, rate-limit, and request failures.

## Run the local MCP server

Build the repository and keep the Agent API Key in the shell or a secret manager:

```bash
npm ci
npm run build
export AIDESIGNER_API_KEY=aid_live_replace_me
export AIDESIGNER_BASE_URL=https://aidesigners.art
node packages/mcp-server/dist/index.js
```

The MCP server uses stdio. It does not open a public port and does not contain service-provider secrets.

### Codex

Add this to `~/.codex/config.toml` and use an absolute path:

```toml
[mcp_servers.aidesigner]
command = "node"
args = ["/absolute/path/to/aidesigner-open/packages/mcp-server/dist/index.js"]
env_vars = ["AIDESIGNER_API_KEY", "AIDESIGNER_BASE_URL"]
```

`env_vars` forwards values from the environment that launches Codex, so the Agent API Key does not need to be copied into the configuration file. Check the connection with `codex mcp list`.

### Claude Code

Copy `.mcp.json.example` to `.mcp.json`, replace only the absolute server path, and keep the key as an environment-variable reference:

```bash
cp .mcp.json.example .mcp.json
```

Claude Code treats this as a local stdio server. Run `claude mcp list` or `/mcp` to approve and inspect the connection.

### Install the workflow Skill

For user-level discovery, copy the Skill folder into the client you use:

```bash
cp -R skills/aidesigner-workflow ~/.codex/skills/
cp -R skills/aidesigner-workflow ~/.claude/skills/
```

Then restart or reload the client. In Codex, ask it to use `$aidesigner-workflow`; in Claude Code, invoke `/aidesigner-workflow` or describe an image, video-remake, ecommerce, or virtual try-on task that matches the Skill description.

## Try the mock server without hosted credentials

The mock server is useful for client and agent integration tests. It accepts keys beginning with `aid_test_` and implements the account and image-generation paths used by the public client:

```bash
npm run build
npm run mock
```

In another shell:

```bash
export AIDESIGNER_API_KEY=aid_test_local
export AIDESIGNER_BASE_URL=http://127.0.0.1:4317
node packages/cli/dist/index.js account
node packages/cli/dist/index.js image generate --input examples/image-request.json
```

The mock returns placeholder URLs and does not call an image provider.

## Public workflow invariants

- Video remake is multi-stage; it is never represented as one synchronous call.
- Time coverage is continuous from `0` through the source duration.
- Every storyboard frame retains a source timestamp or explicit evidence reference.
- Product, person, scene, and source-frame references have explicit roles.
- Product claims require supplied evidence; the workflow must not invent claims.
- Product quantity is preserved unless the user explicitly changes it.
- Final generation follows an explicit confirmation step.
- Long-running work returns a job ID and is polled with backoff.
- Hosted responses never expose private prompts, upstream task IDs, internal storage keys, or billing record IDs.

## Repository map

```text
skills/aidesigner-workflow/   Agent guidance and workflow references
schemas/                      Public JSON Schemas
packages/workflow-types/      Provider-neutral TypeScript contracts
packages/api-client/          Hosted Agent API client
packages/cli/                 Command-line client
packages/mcp-server/          Local stdio MCP server
provider-adapters/            Independent-mode adapter example
mock-server/                  Local contract mock
conformance/                  Public workflow invariant tests
```

## Security and privacy

Never commit an AIDesigner Agent API Key or model-provider key. Use environment variables or a secret manager. Do not place credentials in a Skill, workflow file, fixture, MCP configuration committed to Git, or source file.

For vulnerability reports, follow [SECURITY.md](SECURITY.md) rather than opening a public issue.

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Contributions should preserve the public/private boundary, schema compatibility, evidence requirements, secret-handling rules, and asynchronous workflow invariants.

## License

The repository is provided under the [AIDesigner Source Available License 1.0](LICENSE). It is source-available and **not** an OSI-approved open-source license. The additional conditions restrict multi-tenant hosted resale and commercial redistribution. Read the complete license before using the repository in a product or service; obtain qualified legal advice for commercial use.

The license does not claim ownership of images, videos, audio, plans, manifests, or other artifacts created through use of the software. Third-party model and service terms may apply separately.

## Links

- Product and commercial licensing: <https://aidesigners.art>
- Codex MCP configuration: <https://learn.chatgpt.com/docs/extend/mcp>
- Claude Code MCP configuration: <https://code.claude.com/docs/en/mcp>
