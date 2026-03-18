<div align="center">

# 🤖 KClaw Agent Dashboard

**实时监控你的 AI Agent，一目了然**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-14+-green.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/platform-Desktop%20Mobile-blue.svg)](#)
[![Language](https://img.shields.io/badge/Language-中文%20English-blue.svg)](#)

[English](#english) · [中文](#中文)

</div>

---

## 🖼️ 界面预览

![Dashboard Preview](screenshot1.png)

---

## ⚡ 一键安装

### 🤖 复制给你的 Agent

如果你使用 Claude、Cursor 等 AI Agent，直接复制下面这行命令给它：

> "请帮我下载并启动 KClaw Agent Dashboard：git clone https://github.com/Kaiji-Z/KClaw-agent-dashboard.git && cd KClaw-agent-dashboard && node server.js，然后告诉我访问地址"

### 👤 手动安装（不需要懂代码）

**步骤 1：下载项目**

1. 打开浏览器访问：https://github.com/Kaiji-Z/KClaw-agent-dashboard
2. 点击绿色的 **Code** 按钮
3. 点击 **Download ZIP**
4. 把下载的压缩包解压到任意文件夹

**步骤 2：启动 Dashboard**

1. 双击运行文件夹里的 `start.bat`（Windows）或 `start.sh`（Mac/Linux）
2. 浏览器会自动打开 http://localhost:3456/

> 💡 如果没有 `start.bat`，直接打开终端（Windows 按 Win+R 输入 `cmd`，Mac 打开终端），进入文件夹后输入 `node server.js` 然后回车

---

### ⚡ Quick Install

### 🤖 For AI Agents

If you're using Claude, Cursor, or any AI Agent, just copy this line:

> "Please download and start KClaw Agent Dashboard: git clone https://github.com/Kaiji-Z/KClaw-agent-dashboard.git && cd KClaw-agent-dashboard && node server.js, then tell me the access address"

### 👤 Manual Install (No Coding Required)

**Step 1: Download**

1. Open browser: https://github.com/Kaiji-Z/KClaw-agent-dashboard
2. Click green **Code** button
3. Click **Download ZIP**
4. Extract the ZIP to any folder

**Step 2: Run Dashboard**

1. Double-click `start.bat` (Windows) or `start.sh` (Mac/Linux)
2. Browser will automatically open http://localhost:3456/

> 💡 If no `start.bat`, open terminal (Windows: Win+R → `cmd`, Mac: Terminal), navigate to folder, type `node server.js` and press Enter

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🔄 **实时状态监控** | 一眼看清所有 Agent 是空闲、思考中、还是正在调用工具 |
| 📊 **Token 使用追踪** | 可视化进度条，临近阈值时自动变色预警 |
| 🌐 **多渠道来源** | 支持 Telegram、Discord、WebChat 等多种渠道的 Agent 监控 |
| 📜 **历史记录** | 30 分钟内活跃过的 Agent 都会保留，不会突然"消失" |
| 🔍 **快速搜索** | 按名称、状态、渠道快速筛选 Agent |
| 🌍 **多语言** | 中英文界面一键切换 |
| ⚙️ **零配置启动** | 自动读取 OpenClaw 配置，开箱即用 |

---

## 🚀 快速启动

### 方式一：直接启动

```bash
git clone https://github.com/Kaiji-Z/KClaw-agent-dashboard.git
cd KClaw-agent-dashboard
node server.js
```

访问 **[http://localhost:3456/](http://localhost:3456/)**

### 方式二：环境变量

```bash
export DASHBOARD_PORT=8080
export GATEWAY_URL="http://192.168.1.100:18789"
export LANGUAGE=en
node server.js
```

### 方式三：PM2 后台运行（生产环境推荐）

```bash
npm install -g pm2
pm2 start server.js --name kclaw-dashboard
pm2 save
```

---

## 📱 手机访问（局域网内）

同一 WiFi 下，可以用手机浏览器访问 Dashboard：

1. 查看电脑 IP 地址

   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. 手机浏览器访问：`http://你的电脑IP:3456`

> ⚠️ **注意**：仅限同一局域网（同一 WiFi）内访问。

<details>
<summary><strong>🔧 无法连接排查</strong></summary>

- **Gateway 绑定地址** — 确保 `~/.openclaw/openclaw.json` 中 `gateway.bind` 不是 `loopback`：
  ```json
  { "gateway": { "bind": "0.0.0.0" } }
  ```

- **Windows 防火墙** — 可能需要放行 3456 端口：
  - 控制面板 → Windows Defender 防火墙 → 高级设置
  - 入站规则 → 新建规则 → 端口 → 3456 → 允许连接

- **确认在同一网络** — 手机和电脑必须连接同一个 WiFi

</details>

---

## ⚙️ 配置说明

| 配置项 | 环境变量 | 默认值 | 说明 |
|--------|----------|--------|------|
| `port` | `DASHBOARD_PORT` | 3456 | Dashboard 服务端口 |
| `gatewayUrl` | `GATEWAY_URL` | 自动检测 | Gateway 地址 |
| `refreshInterval` | — | 1500 | 刷新间隔（毫秒） |
| `language` | `LANGUAGE` | zh-CN | 界面语言 |
| `agents` | — | {} | Agent 显示名称配置 |

---

## 🎯 状态说明

Dashboard 会实时分析 Agent 的状态：

| 状态 | 颜色 | 含义 |
|------|------|------|
| 🟢 **活跃** | 绿色 | Agent 刚刚有过活动 |
| 🟡 **思考中** | 黄色 | Agent 正在生成回复（可见思考内容） |
| 🔵 **调用工具** | 蓝色 | Agent 正在调用工具（显示工具名称） |
| ⚪ **空闲** | 灰色 | Agent 超过 10 分钟无活动 |

---

## 👤 人类使用指南

作为普通用户，你可以通过 Dashboard 实时监控你的 Agent 状态。

### 启动 Dashboard

```bash
node server.js
```

然后打开浏览器访问 **http://localhost:3456/**

### 查看 Agent 状态

- 🟢 **绿色** — Agent 正在活跃工作
- 🟡 **黄色** — Agent 正在思考
- 🔵 **蓝色** — Agent 正在调用工具
- ⚪ **灰色** — Agent 处于空闲状态

### 常见用途

- 查看 Agent 当前是否在工作
- 监控 Token 使用量，避免超出限制
- 在手机上查看 Agent 状态（同一 WiFi 下）

---

## 🤖 Agent 集成指南

如果你想让你的 Agent 能够报告状态给 Dashboard，可以集成这个 Skill。

### 方法一：复制项目到 workspace

```bash
# 复制到你的 Agent workspace
cp -r /path/to/KClaw-agent-dashboard ~/.openclaw/workspace/skills/kclaw-dashboard

# 启动 Dashboard
cd ~/.openclaw/workspace/skills/kclaw-dashboard
node server.js
```

### 方法二：使用软链接（推荐）

```bash
# 创建软链接，方便后续更新
ln -s /path/to/KClaw-agent-dashboard ~/.openclaw/workspace/skills/kclaw-dashboard
```

### Agent 回复示例

当 Agent 启动后，可以在回复中告诉用户如何查看状态：

```
你可以在 Dashboard 查看我的实时状态：http://localhost:3456/
```

### 配置 Agent 名称

编辑 `config.json5`：

```json
{
  "agents": {
    "your-agent-id": {
      "name": "AI 助手",
      "emoji": "🤖"
    }
  }
}
```

---

## 📁 项目结构

```
KClaw-agent-dashboard/
├── server.js      # 后端服务（零依赖）
├── index.html     # 前端界面
├── config.json5   # 配置文件（可选）
├── AGENT.md       # Agent 使用指南
├── SKILL.md       # Skill 集成文档
├── README.md      # 本文档
└── screenshot1.png # 界面截图
```

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

[MIT](LICENSE) © 2024

---

<div align="center">

**[⬆ Back to Top](#-kclaw-agent-dashboard)**

Made with ❤️ for the OpenClaw community

</div>

---

# English

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔄 **Real-time Status** | See at a glance if agents are idle, thinking, or using tools |
| 📊 **Token Tracking** | Visual progress bar with color-coded warnings |
| 🌐 **Multi-channel** | Monitor agents from Telegram, Discord, WebChat, etc. |
| 📜 **History** | Agents active within 30 minutes are preserved |
| 🔍 **Quick Search** | Filter by name, status, or channel |
| 🌍 **i18n** | Switch between Chinese and English |
| ⚙️ **Zero Config** | Auto-reads OpenClaw config, works out of the box |

## 🚀 Quick Start

```bash
git clone https://github.com/Kaiji-Z/KClaw-agent-dashboard.git
cd KClaw-agent-dashboard
node server.js
```

Visit **[http://localhost:3456/](http://localhost:3456/)**

## 📱 Mobile Access (LAN Only)

Access from your phone within the same WiFi network:

1. Find your computer IP

   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   ```

2. Phone browser: `http://YOUR_COMPUTER_IP:3456`

> ⚠️ **Note**: Only works within the same LAN (same WiFi).

<details>
<summary><strong>🔧 Troubleshooting</strong></summary>

- **Gateway bind address** — Ensure `gateway.bind` is not `loopback` in `~/.openclaw/openclaw.json`:
  ```json
  { "gateway": { "bind": "0.0.0.0" } }
  ```

- **Windows Firewall** — Allow port 3456:
  - Control Panel → Windows Defender Firewall → Advanced Settings
  - Inbound Rules → New Rule → Port → 3456 → Allow Connection

- **Same Network** — Phone and computer must be on the same WiFi

</details>

## ⚙️ Configuration

Create `config.json5`:

```json
{
  "port": 3456,
  "gatewayUrl": "http://127.0.0.1:18789",
  "refreshInterval": 1500,
  "language": "en",
  "agents": {
    "my-assistant": { "name": "AI Assistant", "emoji": "🤖" }
  }
}
```

## 👤 For Humans

As a regular user, you can monitor your Agent status in real-time via the Dashboard.

### Start Dashboard

```bash
node server.js
```

Then open your browser to **http://localhost:3456/**

### Understanding Agent Status

- 🟢 **Green** — Agent is actively working
- 🟡 **Yellow** — Agent is thinking
- 🔵 **Blue** — Agent is calling tools
- ⚪ **Gray** — Agent is idle

### Common Use Cases

- Check if Agent is currently working
- Monitor Token usage to avoid hitting limits
- View Agent status on your phone (same WiFi)

---

## 🤖 For Agents

If you want your Agent to report status to the Dashboard, integrate this Skill.

### Method 1: Copy to Workspace

```bash
# Copy to your Agent workspace
cp -r /path/to/KClaw-agent-dashboard ~/.openclaw/workspace/skills/kclaw-dashboard

# Start Dashboard
cd ~/.openclaw/workspace/skills/kclaw-dashboard
node server.js
```

### Method 2: Symlink (Recommended)

```bash
# Create symlink for easy updates
ln -s /path/to/KClaw-agent-dashboard ~/.openclaw/workspace/skills/kclaw-dashboard
```

### Agent Response Example

After starting, Agent can tell users how to view status:

```
You can view my real-time status on the Dashboard: http://localhost:3456/
```

### Configure Agent Names

Edit `config.json5`:

```json
{
  "agents": {
    "your-agent-id": {
      "name": "AI Assistant",
      "emoji": "🤖"
    }
  }
}
```

---

## 📄 License

[MIT](LICENSE) © 2024
