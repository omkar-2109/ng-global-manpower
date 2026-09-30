const https = require('https');
const http = require('http');
const env = require('../config/env');

class KeepAliveService {
  constructor() {
    this.intervalHandle = null;
    this.initialTimeoutHandle = null;
    this.stats = {
      enabled: false,
      targetUrl: null,
      intervalMinutes: 12,
      lastPingTime: null,
      lastStatus: null,
      lastDurationMs: null,
      totalPings: 0,
      successfulPings: 0,
      failedPings: 0,
      consecutiveFailures: 0
    };
  }

  // Determine the public target URL to ping
  resolveTargetUrl() {
    // 1. Explicit keep-alive URL override
    if (process.env.KEEP_ALIVE_URL && process.env.KEEP_ALIVE_URL.trim()) {
      return process.env.KEEP_ALIVE_URL.trim().replace(/\/+$/, '');
    }

    // 2. Render-provided external URL (automatically set on Render web services)
    if (process.env.RENDER_EXTERNAL_URL && process.env.RENDER_EXTERNAL_URL.trim()) {
      return process.env.RENDER_EXTERNAL_URL.trim().replace(/\/+$/, '');
    }

    // 3. Configured APP_URL if not localhost
    if (env.appUrl && !env.appUrl.includes('localhost') && !env.appUrl.includes('127.0.0.1')) {
      return env.appUrl.replace(/\/+$/, '');
    }

    return null;
  }

  // Perform single HTTP/S request to health endpoint
  ping(targetBaseUrl) {
    const baseUrl = targetBaseUrl || this.stats.targetUrl;
    if (!baseUrl) {
      return Promise.resolve({ success: false, reason: 'No target URL configured' });
    }

    const pingUrl = `${baseUrl}/health`;
    const startTime = Date.now();

    return new Promise((resolve) => {
      try {
        const client = pingUrl.startsWith('https') ? https : http;
        const req = client.get(pingUrl, {
          timeout: 15000,
          headers: {
            'User-Agent': 'NGGlobal-KeepAlive/2.0 (+https://render.com)',
            'Accept': 'application/json'
          }
        }, (res) => {
          let rawData = '';
          res.on('data', chunk => { rawData += chunk; });
          res.on('end', () => {
            const duration = Date.now() - startTime;
            const isSuccess = res.statusCode >= 200 && res.statusCode < 400;

            this.stats.lastPingTime = new Date().toISOString();
            this.stats.lastStatus = res.statusCode;
            this.stats.lastDurationMs = duration;
            this.stats.totalPings++;

            if (isSuccess) {
              this.stats.successfulPings++;
              this.stats.consecutiveFailures = 0;
              console.log(`[Keep-Alive] 🟢 Ping successful: ${pingUrl} - ${res.statusCode} (${duration}ms)`);
            } else {
              this.stats.failedPings++;
              this.stats.consecutiveFailures++;
              console.warn(`[Keep-Alive] ⚠️ Ping returned non-success: ${res.statusCode} in ${duration}ms`);
            }

            resolve({ success: isSuccess, statusCode: res.statusCode, duration });
          });
        });

        req.on('timeout', () => {
          req.destroy();
          const duration = Date.now() - startTime;
          this.stats.failedPings++;
          this.stats.consecutiveFailures++;
          console.warn(`[Keep-Alive] ⏱️ Ping timeout after ${duration}ms: ${pingUrl}`);
          resolve({ success: false, error: 'Request timeout' });
        });

        req.on('error', (err) => {
          const duration = Date.now() - startTime;
          this.stats.failedPings++;
          this.stats.consecutiveFailures++;
          console.warn(`[Keep-Alive] ❌ Ping connection error: ${err.message} (${duration}ms)`);
          resolve({ success: false, error: err.message });
        });
      } catch (err) {
        console.error(`[Keep-Alive] Unexpected dispatch error:`, err.message);
        resolve({ success: false, error: err.message });
      }
    });
  }

  // Start background keep-alive loop
  start() {
    const target = this.resolveTargetUrl();
    const intervalMinutes = parseInt(process.env.KEEP_ALIVE_INTERVAL_MINUTES || '12', 10);
    const intervalMs = Math.max(intervalMinutes, 5) * 60 * 1000; // minimum 5 mins

    this.stats.targetUrl = target;
    this.stats.intervalMinutes = intervalMinutes;

    if (!target) {
      console.log(`[Keep-Alive] ℹ️ Service standby (no external URL detected; set RENDER_EXTERNAL_URL or KEEP_ALIVE_URL to activate self-ping).`);
      this.stats.enabled = false;
      return;
    }

    this.stats.enabled = true;
    console.log(`[Keep-Alive] 🚀 Active! Monitoring target: ${target}/health every ${intervalMinutes} minutes`);

    // Initial ping after 20 seconds of server boot
    this.initialTimeoutHandle = setTimeout(() => {
      this.ping(target).catch(() => {});
    }, 20000);

    // Recurring ping loop
    this.intervalHandle = setInterval(() => {
      this.ping(target).catch(() => {});
    }, intervalMs);

    // Unref so timer doesn't block clean process shutdown
    if (this.intervalHandle && typeof this.intervalHandle.unref === 'function') {
      this.intervalHandle.unref();
    }
  }

  // Stop background loop
  stop() {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
    if (this.initialTimeoutHandle) {
      clearTimeout(this.initialTimeoutHandle);
      this.initialTimeoutHandle = null;
    }
    this.stats.enabled = false;
    console.log(`[Keep-Alive] Stopped.`);
  }

  // Get current status & telemetry
  getStatus() {
    return {
      ...this.stats,
      uptimeSeconds: Math.floor(process.uptime()),
      systemTime: new Date().toISOString()
    };
  }
}

const instance = new KeepAliveService();
module.exports = instance;
