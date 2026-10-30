# AIDesigner Open Workflow

A public Skill, workflow contract, CLI, local MCP server, schemas, mock server, and provider-adapter interface for agent-driven image creation, video remake, ecommerce imagery, and virtual try-on.

This repository intentionally does **not** contain AIDesigner's production prompts, prompt compilers, provider credentials, billing implementation, database internals, or hosted orchestration code.

## Two execution modes

### Hosted mode

```text
Claude Code / Codex
  → AIDesigner Skill
  → local MCP or CLI
  → AIDesigner Agent API
  → private hosted workflow
```

Hosted mode uses an AIDesigner Agent API Key created from the user's AIDesigner account. Generation consumes that account's AIDesigner credits; the key is not an OpenAI, Gemini, Kling, MiniMax, or other model-provider key.

### Independent mode

```text
Claude Code / Codex
  → AIDesigner Skill
  → compatible provider adapters
  → the user's own models, storage, and job system
```

Independent implementations can reproduce the public workflow and output contracts, but they do not receive AIDesigner's private prompt wording, model routing, exception handling, or tuning. Similar workflow behavior is possible; identical results are not promised.

## Install and build

```bash
npm install
npm run build
npm test
```

Configure hosted mode:

```bash
export AIDESIGNER_API_KEY=aid_live_replace_me
export AIDESIGNER_BASE_URL=https://aidesigners.art
```

Run the CLI:

```bash
npx aidesigner account
npx aidesigner image generate --input image-request.json
npx aidesigner image status TASK_ID
npx aidesigner video create --input video-project.json
npx aidesigner ecommerce create --input ecommerce-project.json
```

Configure the local MCP server with the command produced by:

```bash
npm run build
node packages/mcp-server/dist/index.js
```

The MCP server uses stdio. It does not open a public port and does not contain service-provider secrets.

## Connect Codex or Claude Code

First build the repository and keep the Agent API Key in your shell or secret manager:

```bash
npm install
npm run build
export AIDESIGNER_API_KEY=aid_live_replace_me
export AIDESIGNER_BASE_URL=https://aidesigners.art
```

Use an absolute path to `packages/mcp-server/dist/index.js` in client configuration.

### Codex

Add this to `~/.codex/config.toml`:

```toml
[mcp_servers.aidesigner]
command = "node"
args = ["/absolute/path/to/aidesigner-open/packages/mcp-server/dist/index.js"]
env_vars = ["AIDESIGNER_API_KEY", "AIDESIGNER_BASE_URL"]
```

`env_vars` forwards the values from the environment that launches Codex, so the Agent API Key does not need to be copied into the configuration file. Check the connection with `codex mcp list`.

### Claude Code

Copy `.mcp.json.example` to `.mcp.json`, replace only the absolute server path, and leave the key as an environment-variable reference:

```json
{
  "mcpServers": {
    "aidesigner": {
      "command": "node",
      "args": ["/absolute/path/to/aidesigner-open/packages/mcp-server/dist/index.js"],
      "env": {
        "AIDESIGNER_API_KEY": "${AIDESIGNER_API_KEY}",
        "AIDESIGNER_BASE_URL": "${AIDESIGNER_BASE_URL:-https://aidesigners.art}"
      }
    }
  }
}
```

Claude Code treats this as a local stdio server. Run `claude mcp list` or `/mcp` to approve and inspect the connection.

### Install the workflow Skill

For user-level discovery, copy the Skill folder into the client you use:

```bash
cp -R skills/aidesigner-workflow ~/.codex/skills/
cp -R skills/aidesigner-workflow ~/.claude/skills/
```

Then restart or reload the client. In Codex, ask it to use `$aidesigner-workflow`; in Claude Code, invoke `/aidesigner-workflow` or describe an image, video-remake, or ecommerce task that matches the Skill description.

Current setup references: [Codex MCP configuration](https://learn.chatgpt.com/docs/extend/mcp) and [Claude Code MCP configuration](https://code.claude.com/docs/en/mcp).

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

## Workflow invariants

- Video remake is multi-stage; it is never represented as one synchronous call.
- Time coverage is continuous from `0` through the source duration.
- Every storyboard frame retains a source timestamp or explicit evidence reference.
- Product, person, scene, and source-frame references have explicit roles.
- Product claims require supplied evidence; the workflow must not invent claims.
- Product quantity is preserved unless the user explicitly changes it.
- Final generation follows an explicit confirmation step.
- Long-running work returns a job ID and is polled with backoff.
- Hosted responses never expose private prompts, upstream task IDs, internal storage keys, or billing record IDs.

## License

The code is source-available under the AIDesigner Source Available License in [LICENSE](LICENSE). The additional conditions restrict multi-tenant hosted resale and commercial redistribution, so this is not an OSI-approved open-source license. Obtain legal review before relying on the license for enforcement or commercial licensing.
