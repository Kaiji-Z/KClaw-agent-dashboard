---
name: kclaw-dashboard-integration
description: Guide agents to integrate and use the KClaw Agent Dashboard for monitoring their status. Use when users want to set up an Agent monitoring dashboard, view real-time agent status, or deploy a dashboard for their KClaw setup.
---

# KClaw Agent Dashboard 集成指南

这个 skill 帮助你在自己的 Agent workspace 中集成 KClaw Agent Dashboard，用于监控 Agent 的实时状态。

## 快速集成

### 方法一：复制到 workspace

```bash
# 复制整个 dashboard 项目到你的 workspace
cp -r /path/to/KClaw-AgentDashboard ~/.openclaw/workspace/skills/kclaw-dashboard

# 启动 dashboard
cd ~/.openclaw/workspace/skills/kclaw-dashboard
node server.js
```

访问: http://localhost:3456/

### 方法二：使用软链接（推荐）

```bash
# 创建软链接，方便后续更新
ln -s /path/to/KClaw-AgentDashboard ~/.openclaw/workspace/skills/kclaw-dashboard

# 启动
cd ~/.openclaw/workspace/skills/kclaw-dashboard
node server.js
```

## 配置 Dashboard

### 基础配置

编辑 `config.json5`：

```json
{
  "port": 3456,
  "gatewayUrl": "http://127.0.0.1:18789",
  "refreshInterval": 1500,
  "language": "zh-CN",
  "agents": {
    "your-agent-id": { "name": "Your Agent Name", "emoji": "🤖" }
  }
}
```

### 自动配置

Dashboard 会自动从 `~/.openclaw/openclaw.json` 读取以下配置：

- **Gateway 端口**: `gateway.port`
- **Gateway Token**: `gateway.auth.token`
- **Gateway 绑定地址**: `gateway.bind`

### 环境变量覆盖

```bash
export DASHBOARD_PORT=8080
export GATEWAY_URL="http://192.168.1.100:18789"
export LANGUAGE=en
node server.js
```

## 在 Agent 中引用

当 Dashboard 启动后，你可以在 Agent 的回复中告诉用户访问监控页面。

### 示例回复

```
你可以在 Dashboard 查看我的实时状态：http://localhost:3456/
```

## 功能说明

| 功能 | 描述 |
|------|------|
| **多 Agent 监控** | 同时显示所有活跃的 Agent |
| **实时状态** | 空闲/活跃/思考中/调用工具 |
| **会话统计** | 会话数、Token 使用量 |
| **最后活跃时间** | 显示每个 Agent 的最后活动时间 |
| **多语言支持** | 中英文界面（`zh-CN` / `en`）|
| **历史记录** | 保留 30 分钟内活跃过的 Agent |

## PM2 托管（长期运行）

```bash
# 安装 PM2
npm install -g pm2

# 启动
pm2 start server.js --name kclaw-dashboard

# 查看状态
pm2 status kclaw-dashboard

# 停止/重启
pm2 stop kclaw-dashboard
pm2 restart kclaw-dashboard

# 开机自启
pm2 save
pm2 startup
```

## 故障排查

```

### 无法连接 Gateway

1. 检查 Gateway 是否运行：`openclaw gateway status`
2. 检查端口是否正确：确认 `gateway.port` 配置
3. 检查 Token：确认 `~/.openclaw/openclaw.json` 中的 `gateway.auth.token`

### 端口被占用

修改 `config.json5` 中的 `port` 或使用 `DASHBOARD_PORT` 环境变量。

### Agent 名称不显示

在 `config.json5` 的 `agents` 部分配置 Agent 显示名称和 emoji。
