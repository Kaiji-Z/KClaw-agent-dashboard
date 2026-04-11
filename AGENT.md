# AGENT.md - Kaiji Dashboard 使用指南

轻量级 OpenClaw Agent 状态仪表盘，SSE + 智能轮询，极低资源占用。

## 快速启动

```bash
cd Kaiji-Dashboard
node server.js
```

访问: http://localhost:3456/

自动从 `~/.openclaw/openclaw.json` 读取 Gateway 地址和 Token。

## 配置

编辑 `config.json5`：

```json
{
  "port": 3456,
  "gatewayUrl": "http://127.0.0.1:18789",
  "language": "zh-CN",
  "minInterval": 3000,
  "maxInterval": 30000,
  "ssePollInterval": 10000,
  "agents": {
    "agent-id": { "name": "显示名称", "emoji": "🤖" }
  }
}
```

| 字段 | 默认值 | 说明 |
|------|--------|------|
| `port` | 3456 | 服务端口 |
| `gatewayUrl` | 自动检测 | Gateway 地址 |
| `language` | zh-CN | zh-CN / en |
| `minInterval` | 3000 | 有活跃 Agent 时的轮询间隔（ms） |
| `maxInterval` | 30000 | 全部空闲时的轮询间隔（ms） |
| `ssePollInterval` | 10000 | SSE 服务端查询 Gateway 间隔（ms） |
| `agents` | {} | Agent 名称和 emoji 映射 |

## 环境变量

`DASHBOARD_PORT` / `GATEWAY_URL` / `GATEWAY_TOKEN` / `LANGUAGE`

## 工作模式

1. **SSE 推送（主模式）** — 浏览器零轮询，服务端有变化才推送
2. **智能轮询（兜底）** — SSE 断开自动降级，活跃 3s / 空闲 30s
3. **Page Visibility** — 标签页切走暂停，切回立即刷新

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/status` | GET | 批量获取所有 Agent 状态（单次请求） |
| `/api/events` | GET | SSE 实时推送（有变化才推） |
| `/api/config` | GET | 获取配置（不含 Token） |
| `/api/auto-token` | GET | 获取自动检测的 Token |
| `/api/tools/invoke` | POST | 通用 Gateway 代理（兼容旧版） |

## 故障排查

1. **无法连接 Gateway** — 检查 `gatewayUrl` 或 `GATEWAY_URL` 环境变量
2. **Token 无效** — 检查 `~/.openclaw/openclaw.json` 中的 `gateway.auth.token`
3. **端口被占用** — 修改 `port` 配置或 `DASHBOARD_PORT` 环境变量

## PM2 托管

```bash
pm2 start server.js --name kaiji-dashboard
pm2 save
```
