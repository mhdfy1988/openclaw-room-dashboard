# room-dashboard

本地多 agent 可视化状态面板项目。

## 目标

- 展示 3 个 agent 的实时状态
- 用像素小房间风格可视化主控 / 工作 / 学习三种角色
- 为后续调度、事件流、任务详情打基础

## 项目目录

- `frontend/`：前端页面
- `backend/`：本地状态服务
- `shared/`：前后端共享类型
- `assets/`：像素资源与设计素材
- `docs/`：方案与接口文档
- `scripts/`：辅助脚本

## 当前阶段

当前处于 MVP 骨架阶段：

- [x] 项目结构初始化
- [x] 文档落盘
- [ ] 前端基础页面
- [ ] 后端基础接口
- [ ] 实时状态流

## 运行规划

- 前端：React + Vite + TypeScript
- 后端：Node.js + Fastify + TypeScript
- 实时：SSE

## 共享协作约定

该目录仅用于 `room-dashboard` 项目开发。

- 主控 agent：总体设计、任务分派、整合结果
- Work Buddy：偏实现与验证
- Study Buddy：偏研究、建模、文档，并兼任 UI / 视觉设计职责

## 开发 / 生产分离

- 开发环境与生产环境必须分开
- 开发中的新版本先在 dev 验证，再发布到 prod
- 生产版本应保持稳定可访问，不能因为开发过程而中断

## 文档留存要求

- 每个阶段的设计、开发、研究、学习相关内容都必须在 `docs/` 留存
- 重要方案、取舍、阶段结论、实现计划、部署说明应形成文档，不只停留在聊天里
- 新阶段开始或结束时，应同步补充或更新对应文档
- UI / 场景相关迭代除设计与实现外，还应补充截图评审记录，避免脱离实际效果盲改
- 用户确认过的参考图 / 参考链接 / 风格基准也应留存在 `docs/`，作为后续改版长期参照

## 当前访问地址

- Dev Frontend: `http://127.0.0.1:5173`
- Dev Backend: `http://127.0.0.1:4310`
- Prod App: `http://127.0.0.1:4320`

## OpenClaw Gateway Integration

The backend can read live data from an OpenClaw Gateway instead of the local mock data.

Recommended setup:

1. Copy `backend/openclaw.config.example.json` to `backend/openclaw.config.local.json`
2. Fill in your own `url` and `token`
3. Start the backend normally

Local config file fields:

- `enabled`: Set `false` to force mock mode even if other values exist
- `url`: Gateway base URL. Supports `http(s)://`, `ws(s)://`, or a dashboard URL that already contains `?token=` / `#token=`
- `token`: Gateway bearer token
- `sessionKey`: Optional tool session context. Defaults to `main`
- `timeoutMs`: Optional request timeout in milliseconds. Defaults to `6000`
- `messageChannel`: Optional header forwarded to Gateway tool calls
- `accountId`: Optional header forwarded to Gateway tool calls

Environment variables still work and override file values:

- `OPENCLAW_URL`: Gateway base URL. Supports `http(s)://`, `ws(s)://`, or a dashboard URL that already contains `?token=` / `#token=`.
- `OPENCLAW_TOKEN`: Gateway bearer token. Optional if the token is already embedded in `OPENCLAW_URL`.
- `OPENCLAW_SESSION_KEY`: Optional tool session context. Defaults to `main`.
- `OPENCLAW_TIMEOUT_MS`: Optional request timeout in milliseconds. Defaults to `6000`.
- `OPENCLAW_MESSAGE_CHANNEL`: Optional header forwarded to Gateway tool calls.
- `OPENCLAW_ACCOUNT_ID`: Optional header forwarded to Gateway tool calls.
- `OPENCLAW_ENABLED`: Set to `false` to disable OpenClaw integration.
- `OPENCLAW_CONFIG_FILE`: Optional custom path to a local config JSON file.

When `OPENCLAW_URL` is not set, the backend falls back to mock room data.

If you want to explicitly import your existing local OpenClaw config into the repo-local config file, run:

```powershell
npm run openclaw:import-config
```

That command writes `backend/openclaw.config.local.json`. It is ignored by git.
