/**
 * Kaiji Dashboard
 * 
 * 优化版：
 * - 批量 API（单次请求获取所有 Agent 状态+历史）
 * - SSE 实时推送（有变化才推送，避免无效轮询）
 * - 智能轮询兜底（SSE 断开时自动降级）
 * - 自动从 ~/.openclaw/openclaw.json 读取 Gateway 端口和 Token
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============ 配置加载 ============

const CONFIG_FILE = path.join(__dirname, 'config.json5');
const OPENCLAW_CONFIG = path.join(process.env.USERPROFILE || process.env.HOME, '.openclaw', 'openclaw.json');

let config = {
  port: 3456,
  gatewayUrl: 'http://127.0.0.1:18789',
  refreshInterval: 1500,
  minInterval: 3000,       // 活跃时的最短轮询间隔
  maxInterval: 30000,      // 空闲时的最长轮询间隔
  ssePollInterval: 10000,  // SSE 服务端查询 Gateway 的间隔
  language: 'zh-CN',
  agents: {}
};

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      config = { ...config, ...parsed };
      console.log('✅ 配置文件已加载');
    } catch (e) {
      console.log('⚠️ 配置文件解析失败:', e.message);
    }
  }

  if (process.env.DASHBOARD_PORT) config.port = parseInt(process.env.DASHBOARD_PORT, 10);
  if (process.env.GATEWAY_URL) config.gatewayUrl = process.env.GATEWAY_URL;
  if (process.env.LANGUAGE) config.language = process.env.LANGUAGE;

  if (fs.existsSync(OPENCLAW_CONFIG)) {
    try {
      const ocConfig = JSON.parse(fs.readFileSync(OPENCLAW_CONFIG, 'utf-8'));
      const gatewayPort = ocConfig.gateway?.port;
      const gatewayBind = ocConfig.gateway?.bind || 'loopback';
      
      if (gatewayPort && !process.env.GATEWAY_URL && !fs.existsSync(CONFIG_FILE)) {
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
  console.log(`⏱  SSE 轮询: ${config.ssePollInterval}ms | 活跃: ${config.minInterval}ms | 空闲: ${config.maxInterval}ms`);
}

// ============ Token ============

let AUTO_TOKEN = '';

function loadToken() {
  if (process.env.GATEWAY_TOKEN) {
    AUTO_TOKEN = process.env.GATEWAY_TOKEN;
    console.log('✅ Token 来自环境变量');
    return;
  }
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

// ============ Gateway 请求工具 ============

function gatewayRequest(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(config.gatewayUrl + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let chunk = '';
      res.on('data', c => chunk += c);
      res.on('end', () => {
        try { resolve(JSON.parse(chunk)); }
        catch (e) { reject(new Error('Invalid JSON from gateway')); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Gateway timeout')); });
    req.end(data);
  });
}

// ============ 批量状态获取（单次请求替代 N+1） ============

async function fetchAllAgentStatus(token) {
  // Step 1: 获取所有活跃会话
  const listResult = await gatewayRequest('/tools/invoke', {
    tool: 'sessions_list',
    args: { activeMinutes: 60, messageLimit: 1 }
  }, token);

  if (!listResult.ok) {
    return { error: listResult.error?.message || 'Request failed' };
  }

  let sessions = listResult.result?.details?.sessions || listResult.result?.sessions || [];
  if (sessions.length === 0 && listResult.result?.content?.[0]?.text) {
    try {
      const parsed = JSON.parse(listResult.result.content[0].text);
      sessions = parsed.sessions || [];
    } catch (e) {}
  }

  // Step 2: 按 agent 分组，取每个 agent 最近的 session
  const agentMap = new Map();
  sessions.forEach(s => {
    const agentId = s.key.split(':')[1] || 'unknown';
    if (!agentMap.has(agentId) || s.updatedAt > agentMap.get(agentId).updatedAt) {
      agentMap.set(agentId, s);
    }
  });

  // Step 3: 批量获取最近活跃 agent 的历史（并发）
  const now = Date.now();
  const activeThreshold = 5 * 60 * 1000; // 5分钟内活跃才查历史
  const agents = [];

  const historyPromises = [];
  for (const [agentId, latest] of agentMap) {
    // 只对最近活跃的 agent 查历史
    if (now - latest.updatedAt < activeThreshold) {
      historyPromises.push(
        gatewayRequest('/tools/invoke', {
          tool: 'sessions_history',
          args: { sessionKey: latest.key, limit: 2 }
        }, token).then(r => {
          let messages = [];
          if (r.ok) {
            messages = r.result?.messages || [];
            if (!messages.length && r.result?.content?.[0]?.text) {
              try { messages = JSON.parse(r.result.content[0].text).messages || []; } catch(e) {}
            }
          }
          latest.messages = messages;
        }).catch(() => {})
      );
    }
    agents.push({ agentId, latest });
  }

  await Promise.all(historyPromises);

  return { agents, sessions };
}

// ============ SSE 管理 ============

const sseClients = new Set();
let ssePollTimer = null;
let lastStateHash = '';
let lastFetchResult = null;

function computeStateHash(data) {
  // 用 agent 的 updatedAt + status 生成哈希，用于判断是否有变化
  const summary = (data.agents || []).map(a => 
    `${a.agentId}:${a.latest?.updatedAt}:${a.latest?.messages?.length || 0}`
  ).sort().join('|');
  return crypto.createHash('md5').update(summary).digest('hex').substring(0, 8);
}

function sseBroadcast(data) {
  if (sseClients.size === 0) return;
  const json = JSON.stringify(data);
  for (const res of sseClients) {
    try {
      res.write(`data: ${json}\n\n`);
    } catch (e) {
      sseClients.delete(res);
    }
  }
}

function startSsePolling(token) {
  if (ssePollTimer) clearInterval(ssePollTimer);
  
  const poll = async () => {
    try {
      const data = await fetchAllAgentStatus(token);
      if (data.error) return;
      
      const newHash = computeStateHash(data);
      if (newHash !== lastStateHash) {
        lastStateHash = newHash;
        lastFetchResult = data;
        sseBroadcast(data);
      }
    } catch (e) {
      console.error('SSE poll error:', e.message);
    }
  };

  // 立即执行一次
  poll();
  // 定期轮询
  ssePollTimer = setInterval(poll, config.ssePollInterval);
}

function stopSsePolling() {
  if (ssePollTimer) {
    clearInterval(ssePollTimer);
    ssePollTimer = null;
  }
}

// ============ 多语言 ============

const I18N = {
  'zh-CN': {
    title: 'Agent 状态仪表盘',
    version: 'v4 优化版',
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
    version: 'v4 Optimized',
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

  const token = req.headers['authorization']?.replace('Bearer ', '') || '';

  // 自动 Token
  if (req.url === '/api/auto-token' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ token: AUTO_TOKEN }));
    return;
  }

  // 配置信息
  if (req.url === '/api/config' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({
      refreshInterval: config.refreshInterval,
      minInterval: config.minInterval,
      maxInterval: config.maxInterval,
      ssePollInterval: config.ssePollInterval,
      language: config.language,
      agents: config.agents
    }));
    return;
  }

  // SSE 端点 — 实时推送
  if (req.url === '/api/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // 如果有缓存数据，立即推送
    if (lastFetchResult) {
      res.write(`data: ${JSON.stringify(lastFetchResult)}\n\n`);
    }

    sseClients.add(res);
    console.log(`📡 SSE 客户端连接 (${sseClients.size} 个)`);

    // 启动服务端轮询（如果还没启动）
    startSsePolling(token);

    // 心跳
    const heartbeat = setInterval(() => {
      try { res.write(': heartbeat\n\n'); } catch (e) { clearInterval(heartbeat); }
    }, 30000);

    req.on('close', () => {
      clearInterval(heartbeat);
      sseClients.delete(res);
      console.log(`📡 SSE 客户端断开 (${sseClients.size} 个)`);
      if (sseClients.size === 0) stopSsePolling();
    });
    return;
  }

  // 批量状态 API — 一次性获取所有 Agent 状态
  if (req.url === '/api/status' && req.method === 'GET') {
    if (!token) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing token' }));
      return;
    }
    fetchAllAgentStatus(token)
      .then(data => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
      })
      .catch(e => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      });
    return;
  }

  // 通用 API 代理（保留兼容）
  if (req.url.startsWith('/api/') && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
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
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(data);
        });
      });
      proxyReq.on('error', e => {
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
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
  console.log(`\n🚀 Kaiji Dashboard 已启动: http://localhost:${config.port}/\n`);
});
