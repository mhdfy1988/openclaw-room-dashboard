# OpenClaw Room Dashboard

一个面向 OpenClaw Gateway 的房间态可视化看板。

它把多智能体状态、最近事件、预警、连接来源和房间场景放进一个统一界面，适合本地开发、演示联调，以及远程 Gateway 运行态观察。

## 功能概览

- 像素房间场景展示角色分布和状态
- 角色详情面板，查看会话、模型、令牌和运行信息
- 最近事件、当前连接、预警中心
- OpenClaw Gateway 配置面板
- SSE 实时刷新
- Mock 模式和真实 Gateway 模式切换
- 远程 Gateway `degraded` 降级识别

## 技术栈

- 前端：React 19 + Vite + TypeScript
- 后端：Node.js + Fastify + ESM JavaScript
- 实时：SSE
- 测试：Vitest + Node test runner + Playwright smoke test

## 目录结构

```text
backend/
  src/
    app/
    config/
    providers/openclaw/
    state/
frontend/
  src/
scripts/
```

## 快速开始

### 1. 安装依赖

```powershell
npm install
```

### 2. 启动开发环境

```powershell
npm run dev:bg:start
```

查看状态：

```powershell
npm run dev:bg:status
```

停止：

```powershell
npm run dev:bg:stop
```

### 3. 访问地址

- Dev Frontend: `http://127.0.0.1:5173`
- Dev Backend: `http://127.0.0.1:4310`
- Prod App: `http://127.0.0.1:4320`

## OpenClaw 配置

后端默认读取：

```text
backend/src/openclaw.config.local.json
```

示例文件：

```text
backend/src/openclaw.config.example.json
```

你可以手动复制示例文件，也可以直接导入本机 OpenClaw 配置：

```powershell
npm run openclaw:import-config
```

这个脚本会写入 `backend/src/openclaw.config.local.json`，该文件已被 Git 忽略。

### 配置字段

- `enabled`：是否启用 OpenClaw 接入
- `url`：Gateway 地址，支持 `http(s)://`、`ws(s)://`
- `token`：Gateway Bearer Token
- `sessionKey`：默认会话上下文
- `timeoutMs`：请求超时
- `messageChannel`：透传给 Gateway 的消息通道头
- `accountId`：透传给 Gateway 的账号头
- `alertThresholds`：预警阈值

### 环境变量

- `OPENCLAW_URL`
- `OPENCLAW_TOKEN`
- `OPENCLAW_SESSION_KEY`
- `OPENCLAW_TIMEOUT_MS`
- `OPENCLAW_MESSAGE_CHANNEL`
- `OPENCLAW_ACCOUNT_ID`
- `OPENCLAW_ENABLED`
- `OPENCLAW_CONFIG_FILE`

## 远程 Gateway 注意事项

如果你接的是远程 OpenClaw Gateway，而不是本机 loopback：

- 推荐使用 `wss://`
- 或者使用 SSH 隧道 / Tailscale
- 如果远程只开放了明文 `ws://`，新版 OpenClaw 会拒绝读取 `status / health / system-presence`
- 即使放开明文访问，远程端也可能还需要 `devices approve` 才能完成配对

看板遇到这类情况时会显示：

- `网关部分可用`
- 预警 `远程 Gateway 需要安全接入`
- 渠道健康、连接来源、部分令牌统计显示为 `--`

## 验证

```powershell
npm run verify
```

包含：

- backend lint/build/test
- frontend lint/build/test
- smoke test

## 截图

如果需要生成生产态截图：

```powershell
npm run screenshots:prod:install
npm run screenshots:prod
```

## 当前版本

- `v0.1.0`
