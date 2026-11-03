# AIDesigner Open Workflow（中文简介）

这是 AIDesigner 的公开集成层，用于让 Codex、Claude Code 等 Agent 按照可检查、可复用的工作流完成图片生成、基于证据的视频复刻、电商视觉和虚拟试穿任务。

仓库公开的内容包括：

- 工作流 Skill 和参考文档；
- provider-neutral 的 TypeScript 类型与接口；
- 图片、视频、电商计划和任务状态的 JSON Schema；
- Hosted Agent API 客户端、CLI 和本地 stdio MCP Server；
- 独立部署模式的 provider-adapter 接口与示例；
- 本地 mock server 和 conformance 测试。

仓库不包含 AIDesigner 的生产环境私有 prompt、prompt compiler、供应商密钥、计费实现、数据库内部结构或托管编排代码。

## 两种使用方式

### Hosted mode

本地 CLI 或 MCP Server 使用 AIDesigner Agent API Key 调用 AIDesigner 服务。生成消耗 AIDesigner 账户额度；该 Key 不是 OpenAI、Gemini、Kling、MiniMax 等模型供应商的 Key。

```bash
npm ci
npm run build
export AIDESIGNER_API_KEY=aid_live_replace_me
export AIDESIGNER_BASE_URL=https://aidesigners.art
node packages/cli/dist/index.js account
```

### Independent mode

通过 `packages/workflow-types` 和 `provider-adapters/` 中的公开接口，接入你自己的模型、存储、任务队列和媒体处理服务。独立实现遵循公开工作流，但不会获得 AIDesigner 的私有 prompt、模型路由和调优，因此不保证生成结果完全一致。

## 本地开发

```bash
npm ci
npm run build
npm test
```

不使用线上凭证时，可以运行 mock server：

```bash
npm run mock
```

另开终端后配置：

```bash
export AIDESIGNER_API_KEY=aid_test_local
export AIDESIGNER_BASE_URL=http://127.0.0.1:4317
node packages/cli/dist/index.js account
```

## 重要工作流约束

- 视频复刻必须是多阶段异步流程，不能假设一次同步调用完成；
- 时间轴必须从 `0` 连续覆盖到源视频时长；
- Storyboard 帧必须保留源时间戳或明确的证据引用；
- 产品、人物、场景、源视频帧和风格引用必须有明确角色；
- 产品卖点和事实必须有输入证据，不能凭空生成；
- 未经用户确认，不进入最终视频或电商批量生成；
- 长任务返回 job ID，并使用退避策略轮询；
- 不得暴露私有 prompt、上游任务 ID、内部存储 Key 或计费记录 ID。

## 文档和协议

- 英文完整说明：[README.md](README.md)
- 授权协议：[LICENSE](LICENSE)
- 贡献指南：[CONTRIBUTING.md](CONTRIBUTING.md)
- 行为准则：[CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- 安全报告：[SECURITY.md](SECURITY.md)
- 版本记录：[CHANGELOG.md](CHANGELOG.md)

本项目使用 AIDesigner Source Available License 1.0。该协议是 source-available 协议，不是 OSI 认可的开源协议，并对多租户托管转售和商业再分发设有限制。使用前请完整阅读 [LICENSE](LICENSE)，商业使用请寻求专业法律意见。
