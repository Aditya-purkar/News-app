// backend/ai-svc/src/server.js
const express = require('express');
require('dotenv').config();

const { generateNewsSummary, answerNewsQuestion, generateNewsImage } = require('./aiProvider');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5003;

// Route 1: AI Summary
app.post('/summary', async (req, res) => {
  try {
    const { articles } = req.body;
    if (!articles || !articles.length) return res.status(400).json({ error: 'Articles are required' });

    const result = await generateNewsSummary(articles);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Summary generation failed', details: error.message });
  }
});

// Route 2: AI Chat & Explanations
app.post('/chat', async (req, res) => {
  try {
    const { question, context } = req.body;
    if (!question) return res.status(400).json({ error: 'Question is required' });

    const answer = await answerNewsQuestion({ question, context });
    res.json({ answer });
  } catch (error) {
    res.status(500).json({ error: 'Chat completion failed', details: error.message });
  }
});

// Route 3: AI Image Generation
app.post('/image', async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const result = await generateNewsImage({ prompt, context });
    res.json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`AI Service running internally on port ${PORT}`);
});