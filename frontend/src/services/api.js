import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 20000,
});

export const fetchNews = async (query) => {
  const { data } = await api.get('/news', {
    params: { q: query },
  });

  return data;
};

export const fetchTrendingNews = async () => {
  const { data } = await api.get('/news/trending');
  return data;
};

export const fetchSummary = async (articles) => {
  const { data } = await api.post('/ai/summary', { articles });
  return data;
};

export const fetchChatAnswer = async (payload) => {
  const { data } = await api.post('/ai/chat', payload);
  return data;
};

export const fetchGeneratedImage = async (payload) => {
  const { data } = await api.post('/ai/image', payload);
  return data;
};

export default api;
