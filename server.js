/**
 * KClaw Agent Dashboard
 * 
 * 功能：
 * - 自动从 ~/.openclaw/openclaw.json 读取 Gateway 端口和 Token
 * - 支持配置文件 config.json5
 * - 支持环境变量覆盖
 * - 多语言支持（中英文）
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// ============ 配置加载 ============

const CONFIG_FILE = path.join(__dirname, 'config.json5');
const OPENCLAW_CONFIG = path.join(process.env.USERPROFILE || process.env.HOME, '.openclaw', 'openclaw.json');

// 默认值
let config = {
  port: 3456,
  gatewayUrl: 'http://127.0.0.1:18789',
  refreshInterval: 1500,
  language: 'zh-CN',
  agents: {}
};

// 读取配置文件
function loadConfig() {
  // 1. 从 config.json5 读取
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      // 支持 JSON5 和标准 JSON
      const parsed = JSON.parse(content);
      config = { ...config, ...parsed };
      console.log('✅ 配置文件已加载');
    } catch (e) {
      console.log('⚠️ 配置文件解析失败:', e.message);
    }
  }

  // 2. 环境变量覆盖
  if (process.env.DASHBOARD_PORT) config.port = parseInt(process.env.DASHBOARD_PORT, 10);
  if (process.env.GATEWAY_URL) config.gatewayUrl = process.env.GATEWAY_URL;
  if (process.env.LANGUAGE) config.language = process.env.LANGUAGE;

  // 3. 从 openclaw.json 自动读取 Gateway 端口
  if (fs.existsSync(OPENCLAW_CONFIG)) {
    try {
      const ocConfig = JSON.parse(fs.readFileSync(OPENCLAW_CONFIG, 'utf-8'));
      const gatewayPort = ocConfig.gateway?.port;
      const gatewayBind = ocConfig.gateway?.bind || 'loopback';
      
      if (gatewayPort && !process.env.GATEWAY_URL && !fs.existsSync(CONFIG_FILE)) {
        // 只有在没有手动配置时才自动设置
        const host = gatewayBind === 'loopback' ? '127.0.0.1' : '0.0.0.0';
        config.gatewayUrl = `http://${host}:${gatewayPort}`;
        console.log(`✅ 自动检测 Gateway: ${config.gatewayUrl}`);
      }
    } catch (e) {
      console.log('⚠️ 无法读取 OpenClaw 配置:', e.message);
    }
  }

  console.log(`📡 Dashboard: http://localhost:${config.port}/`);
  console.log(`🔗 Gateway: ${config.gatewayUrl}`);
  console.log(`🌐 语言: ${config.language}`);
}

// ============ Token 自动获取 ============

let AUTO_TOKEN = '';

function loadToken() {
  // 1. 环境变量
  if (process.env.GATEWAY_TOKEN) {
    AUTO_TOKEN = process.env.GATEWAY_TOKEN;
    console.log('✅ Token 来自环境变量');
    return;
  }

  // 2. openclaw.json
  if (fs.existsSync(OPENCLAW_CONFIG)) {
    try {
      const ocConfig = JSON.parse(fs.readFileSync(OPENCLAW_CONFIG, 'utf-8'));
      AUTO_TOKEN = ocConfig.gateway?.auth?.token || 
                   ocConfig.gateway?.operatorToken || 
                   ocConfig.gateway?.token || '';
      if (AUTO_TOKEN) {
        console.log('✅ Token 已自动获取');
        return;
      }
    } catch (e) {}
  }

  console.log('⚠️ 未找到 Token，需要手动输入');
}

// ============ 多语言支持 ============

const I18N = {
  'zh-CN': {
    title: 'Agent 状态仪表盘',
    version: 'v3 通用版',
    connect: '连接 Gateway',
    connectHint: '输入 Gateway Token 以连接',
    tokenPlaceholder: 'Token...',
    connectBtn: '连接',
    connected: '已连接',
    disconnected: '未连接',
    loading: '正在加载...',
    noAgents: '暂无活跃的 Agent',
    sessions: '会话数',
    lastActive: '最后活跃',
    justNow: '刚刚',
    minutesAgo: '分钟前',
    hoursAgo: '小时前',
    daysAgo: '天前',
    lastUpdate: '最后更新',
    idle: '空闲',
    maybeIdle: '可能空闲',
    active: '活跃',
    thinking: '思考中',
    toolUse: '调用工具',
    processing: '处理中',
    interrupted: '已中断',
    thinkingNow: '正在思考',
    responding: '正在响应',
    calling: '正在调用',
    private: '私信',
    group: '群聊'
  },
  'en': {
    title: 'Agent Dashboard',
    version: 'v3 Universal',
    connect: 'Connect Gateway',
    connectHint: 'Enter Gateway Token to connect',
    tokenPlaceholder: 'Token...',
    connectBtn: 'Connect',
    connected: 'Connected',
    disconnected: 'Disconnected',
    loading: 'Loading...',
    noAgents: 'No active agents',
    sessions: 'Sessions',
    lastActive: 'Last Active',
    justNow: 'Just now',
    minutesAgo: 'min ago',
    hoursAgo: 'h ago',
    daysAgo: 'd ago',
    lastUpdate: 'Last update',
    idle: 'Idle',
    maybeIdle: 'Maybe idle',
    active: 'Active',
    thinking: 'Thinking',
    toolUse: 'Tool use',
    processing: 'Processing',
    interrupted: 'Interrupted',
    thinkingNow: 'Thinking',
    responding: 'Responding',
    calling: 'Calling',
    private: 'DM',
    group: 'Group'
  }
};

function t(key) {
  return I18N[config.language]?.[key] || I18N['en'][key] || key;
}

// ============ HTTP 服务器 ============

loadConfig();
loadToken();

const server = http.createServer((req, res) => {
  // CORS
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end();
    return;
  }

  // 自动 Token
  if (req.url === '/api/auto-token' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ token: AUTO_TOKEN }));
    return;
  }

  // 配置信息（不含敏感信息）
  if (req.url === '/api/config' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({
      refreshInterval: config.refreshInterval,
      language: config.language,
      agents: config.agents
    }));
    return;
  }

  // API 代理
  if (req.url.startsWith('/api/') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const token = req.headers['authorization']?.replace('Bearer ', '') || '';
      const gatewayPath = req.url.replace('/api', '');
      
      const proxyReq = http.request(config.gatewayUrl + gatewayPath, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      }, proxyRes => {
        let data = '';
        proxyRes.on('data', chunk => data += chunk);
        proxyRes.on('end', () => {
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(data);
        });
      });
      proxyReq.on('error', e => {
        res.writeHead(500, { 
          'Content-Type': 'application/json', 
          'Access-Control-Allow-Origin': '*' 
        });
        res.end(JSON.stringify({ error: e.message }));
      });
      proxyReq.end(body);
    });
    return;
  }

  // 静态文件
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);
  const mimeTypes = { 
    '.html': 'text/html; charset=utf-8', 
    '.js': 'text/javascript', 
    '.css': 'text/css',
    '.json': 'application/json',
    '.svg': 'image/svg+xml'
  };
  
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      res.end(content);
    }
  });
});

server.listen(config.port, () => {
  console.log(`\n🚀 Agent Dashboard 已启动: http://localhost:${config.port}/\n`);
});
