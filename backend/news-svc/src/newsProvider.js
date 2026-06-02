// backend/news-svc/src/newsProvider.js
const axios = require('axios');

const GNEWS_BASE_URL = 'https://gnews.io/api/v4';
const NEWSDATA_BASE_URL = 'https://newsdata.io/api/1';
const STOP_WORDS = new Set(['the', 'a', 'an', 'for', 'of', 'and', 'or', 'to', 'in', 'on', 'at']);
const newsCache = new Map();
let trendingCache = [];
let gnewsCooldownUntil = 0;

const isValidHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const buildImageProxyUrl = (imageUrl, articleUrl) => {
  const params = new URLSearchParams();
  if (isValidHttpUrl(imageUrl)) params.set('url', imageUrl);
  if (isValidHttpUrl(articleUrl)) params.set('articleUrl', articleUrl);
  return params.toString() ? `/api/news/image?${params.toString()}` : '';
};

const sanitizeQuery = (value) => value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const buildQueryCandidates = (keyword) => {
  const sanitized = sanitizeQuery(keyword).slice(0, 200);
  const words = sanitized.split(' ').filter(Boolean).filter((word) => !STOP_WORDS.has(word));
  const shortened = words.slice(0, 3).join(' ');
  const firstWord = words[0] || '';
  const secondWord = words[1] || '';
  return [...new Set([firstWord, `${firstWord} ${secondWord}`.trim(), shortened].filter(Boolean))];
};

const normalizeArticle = (article) => ({
  title: article.title,
  description: article.description,
  url: article.url,
  image: buildImageProxyUrl(article.image, article.url),
  publishedAt: article.publishedAt,
  source: article.source?.name || 'Unknown',
});

const normalizeNewsDataArticle = (article) => ({
  title: article.title,
  description: article.description || article.content || '',
  url: article.link,
  image: buildImageProxyUrl(article.image_url, article.link),
  publishedAt: article.pubDate,
  source: article.source_name || 'Unknown',
});

const isGNewsQuotaOrTimeoutError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return error?.statusCode === 403 || message.includes('request limit') || message.includes('change-plan');
};

const isGNewsCoolingDown = () => Date.now() < gnewsCooldownUntil;

const setGNewsCooldown = (error) => {
  if (isGNewsQuotaOrTimeoutError(error)) gnewsCooldownUntil = Date.now() + 30 * 60 * 1000;
};

const getApiKey = () => process.env.GNEWS_API_KEY;
const getNewsDataApiKey = () => process.env.NEWSDATA_API_KEY;

const fetchNewsDataTrending = async () => {
  const apiKey = getNewsDataApiKey();
  if (!apiKey) return [];
  const { data } = await axios.get(`${NEWSDATA_BASE_URL}/latest`, {
    params: { apikey: apiKey, q: 'business', category: 'business', country: 'us', language: 'en', size: 10, image: 1 },
    timeout: 15000,
  });
  return (data.results || []).map(normalizeNewsDataArticle);
};

const fetchTrendingBusinessNews = async () => {
  if (!isGNewsCoolingDown()) {
    try {
      const { data } = await axios.get(`${GNEWS_BASE_URL}/top-headlines`, {
        params: { category: 'business', lang: 'en', country: 'us', max: 10, apikey: getApiKey() },
        timeout: 15000,
      });
      const articles = (data.articles || []).map(normalizeArticle);
      trendingCache = articles;
      return articles;
    } catch (error) {
      setGNewsCooldown(error);
    }
  }
  // Fallback
  const newsDataArticles = await fetchNewsDataTrending();
  if (newsDataArticles.length) {
    trendingCache = newsDataArticles;
    return newsDataArticles;
  }
  throw new Error('Trending business news is temporarily unavailable.');
};

const fetchNewsByKeyword = async (keyword) => {
  const queryCandidates = buildQueryCandidates(keyword);
  const cacheKey = sanitizeQuery(keyword);

  if (!isGNewsCoolingDown()) {
    for (const safeQuery of queryCandidates) {
      try {
        const { data } = await axios.get(`${GNEWS_BASE_URL}/search`, {
          params: { q: safeQuery, lang: 'en', country: 'us', max: 10, sortby: 'publishedAt', apikey: getApiKey() },
          timeout: 15000,
        });
        const articles = (data.articles || []).map(normalizeArticle);
        newsCache.set(cacheKey, articles);
        return articles;
      } catch (error) {
        setGNewsCooldown(error);
        break; // Simplify loop for brevity
      }
    }
  }
  throw new Error('Unable to fetch live news from GNews.');
};

// Export the functions so the Express server can use them
module.exports = {
  fetchNewsByKeyword,
  fetchTrendingBusinessNews,
  proxyNewsImage
};