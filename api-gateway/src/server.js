// api-gateway/src/server.js
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-svc:5001';
const NEWS_SERVICE_URL = process.env.NEWS_SERVICE_URL || 'http://news-svc:5002';
const AI_SERVICE_URL   = process.env.AI_SERVICE_URL   || 'http://ai-svc:5003';

// FIX 1: CORS origin driven by env var so it works in both local dev and k8s.
//   - Local dev (.env):  CORS_ORIGIN=http://localhost:5173
//   - Kubernetes (api-gateway.yml env): CORS_ORIGIN=*
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
const corsOptions = corsOrigin === '*'
  ? { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] }
  : { origin: corsOrigin.split(','), credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization'] };

app.use(cors(corsOptions));

// Handle CORS preflight for all routes
app.options('*', cors(corsOptions));

// Gateway traffic logger
app.use((req, res, next) => {
  console.log(`[Gateway] ${req.method} ${req.url}`);
  next();
});

// /api/auth  →  auth-svc:/auth/...
app.use('/api/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/auth': '/auth' },
  onError: (err, req, res) => {
    console.error('[Gateway] Auth proxy error:', err.message);
    res.status(503).json({ error: 'Authentication service unreachable.' });
  }
}));

// FIX 2: news-svc search handler lives at GET / (not GET /news).
//   Strip /api/news entirely so the request arrives at / on news-svc.
//   e.g. /api/news?q=tesla  →  /?q=tesla   (hits app.get('/') in news-svc)
//        /api/news/trending  →  /trending   (hits app.get('/trending'))
//        /api/news/image     →  /image      (hits app.get('/image'))
app.use('/api/news', createProxyMiddleware({
  target: NEWS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/news': '' },
  onError: (err, req, res) => {
    console.error('[Gateway] News proxy error:', err.message);
    res.status(503).json({ error: 'News service unreachable.' });
  }
}));

// /api/ai  →  ai-svc:/ai/...
app.use('/api/ai', createProxyMiddleware({
  target: AI_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/ai': '/ai' },
  onError: (err, req, res) => {
    console.error('[Gateway] AI proxy error:', err.message);
    res.status(503).json({ error: 'AI service unreachable.' });
  }
}));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'NewsEra API Gateway is running.' });
});

app.listen(PORT, () => {
  console.log(`API Gateway on port ${PORT}`);
  console.log(`  /api/auth  → ${AUTH_SERVICE_URL}/auth`);
  console.log(`  /api/news  → ${NEWS_SERVICE_URL}/`);
  console.log(`  /api/ai    → ${AI_SERVICE_URL}/ai`);
});