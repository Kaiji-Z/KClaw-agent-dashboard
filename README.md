# Kaiji Dashboard

**轻量级 OpenClaw Agent 状态仪表盘，SSE + 智能轮询，极低资源占用**

## ✨ 特性

- 📡 **SSE 实时推送** — 服务端有变化才推送，浏览器零轮询
- 🧠 **智能轮询兜底** — SSE 断开自动降级，活跃 3s / 空闲 30s
- 👁️ **Page Visibility** — 标签页切到后台完全暂停，切回立即刷新
- 📦 **批量 API** — 单次请求获取所有 Agent 状态（替代 N+1）
- 🖼️ **防抖渲染** — `requestAnimationFrame` 合并更新
- 📊 **Token 追踪** — 可视化进度条 + 阈值预警
- 🔍 **搜索/多语言/零配置** — 开箱即用

## 🚀 启动

```bash
cd Kaiji-Dashboard
node server.js
```

访问 http://localhost:3456/

自动从 `~/.openclaw/openclaw.json` 读取 Gateway 地址和 Token，无需手动配置。

## ⚙️ 配置

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
    "main": { "name": "肉包", "emoji": "🥟" }
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
| `ssePollInterval` | 10000 | SSE 服务端查询 Gateway 的间隔（ms） |
| `agents` | {} | Agent 名称和 emoji 映射 |

### 环境变量

`DASHBOARD_PORT` / `GATEWAY_URL` / `GATEWAY_TOKEN` / `LANGUAGE`

## 🏗️ 架构

```
浏览器 ──SSE长连接──> Dashboard Server ──(每10s)──> Gateway
   │    (有变化才推)    │                    │
   │                   │  GET /api/status    │
   │                   │  (单次批量请求)      │
   │                   │<─── 所有Agent数据 ──│
   │                   │                     │
   │  SSE 断开时降级 ──>│  智能轮询(3~30s)   │
```

**请求量对比：**
- 旧版 v3：240 次/分钟（5 Agent × 1.5s 轮询）
- 新版 v4：6 次/分钟（SSE 模式），0 次（标签页后台）

## 📁 项目结构

```
Kaiji-Dashboard/
├── server.js      # 后端（零依赖，含 SSE + 批量 API）
├── index.html     # 前端（单文件，含 CSS + JS）
├── config.json5   # 配置
├── AGENT.md       # Agent 使用指南
├── README.md      # 本文档
└── OPTIMIZATION-REPORT.md  # 优化方案详细报告
```

## 📱 手机访问

同一 WiFi 下用电脑 IP 访问 `http://你的IP:3456`

## 📄 许可证

MIT
