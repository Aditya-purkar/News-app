// api-gateway/src/server.js
const express = require('express');
const cors = require('cors');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Define your microservice URLs (Sanitized string formatting)
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-svc:5001';
const NEWS_SERVICE_URL = process.env.NEWS_SERVICE_URL || 'http://news-svc:5002';
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://ai-svc:5003';
// 1. Configure CORS to accept requests from both Vite directly and Nginx
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 2. Gateway Traffic Logger (Highly recommended for debugging)
app.use((req, res, next) => {
  console.log(`[Gateway Log] ${req.method} request received for: ${req.url}`);
  next();
});

// 3. Attach Proxies BEFORE the Health Check and Server Listen
app.use('/api/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/auth',
  },
  onError: (err, req, res) => {
    console.error('[Gateway Error] Auth Proxy failed:', err.message);
    res.status(503).json({ error: 'Authentication service unreachable.' });
  }
}));

app.use('/api/news', createProxyMiddleware({
  target: NEWS_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/news': '/news', 
  },
  onError: (err, req, res) => {
    console.error('[Gateway Error] News Proxy failed:', err.message);
    res.status(503).json({ error: 'News service unreachable.' });
  }
}));

app.use('/api/ai', createProxyMiddleware({
  target: AI_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/ai': '/ai', 
  },
  onError: (err, req, res) => {
    console.error('[Gateway Error] AI Proxy failed:', err.message);
    res.status(503).json({ error: 'AI service unreachable.' });
  }
}));

// 4. Health Check Endpoint
app.get('/', (req, res) => {
  res.json({ message: 'ET NewsEra API Gateway is running normally.' });
});

// 5. Boot the Server (Always goes at the very bottom!)
app.listen(PORT, () => {
  console.log(`API Gateway operational on port ${PORT}`);
  console.log(`Routing /api/auth -> ${AUTH_SERVICE_URL}`);
  console.log(`Routing /api/news -> ${NEWS_SERVICE_URL}`);
  console.log(`Routing /api/ai   -> ${AI_SERVICE_URL}`);
});