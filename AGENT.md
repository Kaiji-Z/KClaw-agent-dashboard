# AGENT.md - Agent Dashboard 使用指南

这是一个通用的 OpenClaw Agent 状态仪表盘，用于监控多个 Agent 的实时状态。

## 快速启动

```bash
cd /path/to/agent-dashboard-general
node server.js
```

访问: http://localhost:3456/

## 配置文件

编辑 `config.json5` 自定义参数：

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

### 配置字段说明

| 字段 | 类型 | 说明 |
|------|------|------|
| `port` | number | Dashboard 服务端口，默认 3456 |
| `gatewayUrl` | string | Gateway URL，默认自动检测 |
| `refreshInterval` | number | 刷新间隔（毫秒），默认 1500 |
| `language` | string | 界面语言：`zh-CN` 或 `en` |
| `agents` | object | Agent 显示名称配置 |

## 环境变量

| 变量 | 说明 |
|------|------|
| `DASHBOARD_PORT` | 服务端口 |
| `GATEWAY_URL` | Gateway 地址 |
| `GATEWAY_TOKEN` | Gateway Token |
| `LANGUAGE` | 界面语言 |

## 功能说明

- **自动配置**: 从 `~/.openclaw/openclaw.json` 自动读取 Gateway 端口和 Token
- **多语言**: 支持中英文界面
- **状态监控**: 空闲/活跃/思考中/调用工具
- **历史记录**: 保留 30 分钟内活跃过的 Agent

## PM2 托管

```bash
pm2 start server.js --name agent-dashboard
pm2 save
pm2 startup
```

## 故障排查

1. **无法连接 Gateway**: 检查 `gatewayUrl` 配置或 `GATEWAY_URL` 环境变量
2. **Token 无效**: 检查 `~/.openclaw/openclaw.json` 中的 `gateway.auth.token`
3. **端口被占用**: 修改 `port` 配置或使用 `DASHBOARD_PORT` 环境变量
