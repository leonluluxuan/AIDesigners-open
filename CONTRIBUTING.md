# Contributing

感谢你为 AIDesigner Open Workflow 提交改进。

## Before opening an issue or pull request

- Search existing issues and pull requests first.
- For security vulnerabilities, follow [SECURITY.md](SECURITY.md); do not open a public issue.
- Do not include API keys, provider credentials, private prompts, private customer data, signed URLs, or production task IDs.
- Keep changes within the public integration boundary. Private prompt compilers, hosted routing, billing, storage internals, and production-only orchestration do not belong here.

## Development

Requirements: Node.js 20+ and npm 10+.

```bash
npm ci
npm run build
npm test
```

Add or update a conformance test when changing a public schema, workflow invariant, client contract, or Skill rule. Keep examples valid and use placeholder URLs or test credentials only.

## Pull requests

Please include:

- a concise description of the behavior or contract change;
- tests or a clear reason a test is not applicable;
- documentation updates for user-facing changes;
- migration notes for breaking schema or workflow changes.

Prefer small, focused pull requests. Do not silently change the meaning of an existing public field. If a change is intentionally incompatible, update the workflow version and explain the migration path.

## Contributions and license

By submitting a contribution, you confirm that you have the right to submit it and agree that it will be governed by the contribution terms in [LICENSE](LICENSE). The project may use, modify, distribute, sublicense, and commercialize accepted contributions under those terms.
