#!/usr/bin/env node

/**
 * NG Global Manpower - Standalone Render Keep-Alive Pinger
 * Usage:
 *   node scripts/keep-alive-worker.js [TARGET_URL] [INTERVAL_MINUTES]
 * Example:
 *   node scripts/keep-alive-worker.js https://ng-global-manpower.onrender.com 12
 */

const https = require('https');
const http = require('http');

const targetUrl = process.argv[2] || process.env.KEEP_ALIVE_URL || process.env.RENDER_EXTERNAL_URL || 'https://ng-global-manpower.onrender.com';
const intervalMinutes = parseInt(process.argv[3] || process.env.KEEP_ALIVE_INTERVAL_MINUTES || '12', 10);
const intervalMs = intervalMinutes * 60 * 1000;

console.log('=======================================================');
console.log('📡 NG Global Manpower - Render Keep-Alive Worker');
console.log(`🎯 Target URL:       ${targetUrl}`);
console.log(`⏱️ Ping Interval:   Every ${intervalMinutes} minutes (${intervalMs / 1000}s)`);
console.log(`🛡️ Render Free Tier: Prevents automatic 15-min idle shutdown`);
console.log('=======================================================');

function ping() {
  const cleanBase = targetUrl.replace(/\/+$/, '');
  const endpoint = `${cleanBase}/health`;
  const startTime = Date.now();
  const client = endpoint.startsWith('https') ? https : http;

  const req = client.get(endpoint, {
    timeout: 20000,
    headers: {
      'User-Agent': 'NGGlobal-ExternalKeepAlive/2.0',
      'Accept': 'application/json'
    }
  }, (res) => {
    let body = '';
    res.on('data', chunk => { body += chunk; });
    res.on('end', () => {
      const duration = Date.now() - startTime;
      const timestamp = new Date().toLocaleTimeString();
      if (res.statusCode >= 200 && res.statusCode < 400) {
        console.log(`[${timestamp}] 🟢 200 OK - Service active (${duration}ms)`);
      } else {
        console.warn(`[${timestamp}] ⚠️ Status ${res.statusCode} (${duration}ms)`);
      }
    });
  });

  req.on('timeout', () => {
    req.destroy();
    console.warn(`[${new Date().toLocaleTimeString()}] ⏱️ Request timed out after 20s`);
  });

  req.on('error', (err) => {
    console.error(`[${new Date().toLocaleTimeString()}] ❌ Connection error: ${err.message}`);
  });
}

// Initial ping
ping();

// Recurring loop
setInterval(ping, intervalMs);
