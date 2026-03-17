# KClaw Agent Dashboard

一个通用的 OpenClaw Agent 状态仪表盘，可以监控多个 Agent 的实时状态。

## 功能特性

- ✅ **自动配置** - 从 `~/.openclaw/openclaw.json` 自动读取 Gateway 端口和 Token
- ✅ **配置文件支持** - 通过 `config.json5` 自定义参数
- ✅ **环境变量覆盖** - 支持 `DASHBOARD_PORT`、`GATEWAY_URL`、`LANGUAGE` 等环境变量
- ✅ **多语言支持** - 中英文界面切换
- ✅ **Agent 名称配置** - 在 `config.json5` 中自定义 Agent 显示名称和 emoji
- ✅ **无硬编码** - 端口、URL 等均可配置
- ✅ **HTTP 轮询** - 1.5s 刷新间隔，稳定可靠
- ✅ **状态监控** - 实时显示 Agent 状态（空闲/活跃/思考中/调用工具）
- ✅ **历史记录** - 保留 30 分钟内活跃过的 Agent

## 快速开始

### 方法一：直接启动
```bash
cd KClaw-AgentDashboard
node server.js
```
访问: http://localhost:3456/

### 方法二：使用环境变量
```bash
export DASHBOARD_PORT=8080
export GATEWAY_URL="http://192.168.1.100:18789"
node server.js
```
访问: http://localhost:8080/

### 方法三：PM2 托管（推荐生产环境）
```bash
npm install -g pm2
pm2 start server.js --name kclaw-dashboard
pm2 save
pm2 startup
```

## 配置文件 (config.json5)
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

## 文件结构
```
KClaw-AgentDashboard/
├── AGENT.md       # Agent 使用指南
├── SKILL.md       # 集成 skill
├── config.json5   # 配置文件
├── server.js      # 服务器
├── index.html     # 前端页面
└── README.md      # 说明文档
```

## 许可证

MIT
