// backend/news-svc/src/server.js
const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const { fetchNewsByKeyword, fetchTrendingBusinessNews,proxyNewsImage } = require('./newsProvider');
const SearchHistory = require('./models/searchHistoryModel');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5002;

// Connect to the isolated News Database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/newsera_news')
  .then(() => console.log('News Service connected to MongoDB'))
  .catch(err => console.error('News DB connection error:', err));

// Route 1: Search News (And save history)
app.get('/news', async (req, res) => {
  try {
    const { q } = req.query;
    // In a full microservices setup, the Gateway passes the user ID in the headers
    const userId = req.headers['x-user-id'] || 'anonymous'; 

    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    // 1. Save to Database
    if (userId !== 'anonymous') {
      await SearchHistory.create({ userId, query: q });
    }

    // 2. Fetch from GNews
    const articles = await fetchNewsByKeyword(q);
    res.json({ articles });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch news', details: error.message });
  }
});

// Route 2: Trending News
app.get('/news/trending', async (req, res) => {
  try {
    const articles = await fetchTrendingBusinessNews();
    res.json({ articles });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch trending news', details: error.message });
  }
});

// Route 3: Proxy images to bypass CORS/hotlinking issues
app.get('/news/image', async (req, res) => {
  try {
    const { url, articleUrl } = req.query;
    if (!url) return res.status(400).json({ error: 'Image URL is required' });

    const imageResponse = await proxyNewsImage({ imageUrl: url, articleUrl });
    
    res.set('Content-Type', imageResponse.headers['content-type']);
    res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    
    // Pipe the image stream directly to the frontend
    imageResponse.data.pipe(res);
  } catch (error) {
    // Return a transparent 1x1 pixel on failure so the frontend doesn't show broken images
    const transparentPixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.set('Content-Type', 'image/gif');
    res.send(transparentPixel);
  }
});

app.listen(PORT, () => {
  console.log(`News Service running internally on port ${PORT}`);
});