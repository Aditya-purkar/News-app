// backend/ai-svc/src/aiProvider.js
const OpenAI = require('openai');
const { GoogleGenAI, Modality } = require('@google/genai');

const parseProviderOrder = (value, fallback) =>
  (value ?? fallback).split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);

const TEXT_PROVIDER_ORDER = parseProviderOrder(process.env.AI_TEXT_PROVIDER_ORDER, 'openai,gemini,xai,openrouter');
const IMAGE_PROVIDER_ORDER = parseProviderOrder(process.env.AI_IMAGE_PROVIDER_ORDER, '');

const OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || 'gpt-4.1-mini';
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1';
const GEMINI_TEXT_MODEL = process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash';
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const XAI_TEXT_MODEL = process.env.XAI_TEXT_MODEL || 'grok-4-1-fast';
const XAI_IMAGE_MODEL = process.env.XAI_IMAGE_MODEL || 'grok-imagine-image';
const OPENROUTER_TEXT_MODEL = process.env.OPENROUTER_TEXT_MODEL || 'moonshotai/kimi-k2-0905';

const SUMMARY_MAX_TOKENS = Number(process.env.AI_SUMMARY_MAX_TOKENS || 900);
const CHAT_MAX_TOKENS = Number(process.env.AI_CHAT_MAX_TOKENS || 500);
const IMAGE_CONTEXT_LIMIT = Number(process.env.AI_IMAGE_CONTEXT_LIMIT || 800);
const providerCooldowns = new Map();

const getOpenAIClient = () => process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const getXAIClient = () => process.env.XAI_API_KEY ? new OpenAI({ apiKey: process.env.XAI_API_KEY, baseURL: 'https://api.x.ai/v1' }) : null;
const getOpenRouterClient = () => process.env.OPENROUTER_API_KEY ? new OpenAI({ apiKey: process.env.OPENROUTER_API_KEY, baseURL: 'https://openrouter.ai/api/v1', defaultHeaders: { 'HTTP-Referer': 'http://localhost:5173', 'X-Title': 'AI News Navigator' } }) : null;
const getGeminiClient = () => process.env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }) : null;

const cleanJsonFence = (value) => String(value || '').replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

const parseJsonResponse = (text) => {
  const cleaned = cleanJsonFence(text);
  if (!cleaned) throw new Error('AI response was empty.');
  try { return JSON.parse(cleaned); } catch {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[0]); } catch { /* Fall through */ }
    }
    const lineMatches = cleaned.split('\n').map((line) => line.trim()).filter(Boolean).filter((line) => !line.startsWith('{') && !line.startsWith('}'));
    const summaryMatches = [...cleaned.matchAll(/(?:^|\n)\s*(?:[-*]|\d+\.)\s*(.+)/g), ...lineMatches.map((line) => [null, line])].map((match) => match[1].trim()).filter(Boolean);
    const whyMatch = cleaned.match(/why it matters[:\s-]*(.+)/i)?.[1]?.trim() || cleaned.match(/importance[:\s-]*(.+)/i)?.[1]?.trim() || '';
    if (summaryMatches.length) return { summary: summaryMatches.slice(0, 5), highlights: summaryMatches.slice(5, 9), whyItMatters: whyMatch || summaryMatches[0] };
    throw new Error('AI response could not be parsed as JSON.');
  }
};

const formatArticlesForPrompt = (articles) => articles.slice(0, 4).map((a, i) => `${i + 1}. Title: ${a.title}\nDescription: ${(a.description || 'N/A').slice(0, 140)}\nSource: ${a.source || 'Unknown'}`).join('\n\n');

const buildFallbackSummary = (articles) => {
  const topArticles = articles.slice(0, 5);
  const shorten = (text, maxLength = 110) => text ? (text.length <= maxLength ? text : `${text.slice(0, maxLength).trimEnd()}...`) : '';
  return {
    summary: topArticles.map((a) => shorten(a.description) || shorten(`${a.title} is one of the leading live developments.`)),
    highlights: topArticles.slice(0, 4).map((a) => shorten(a.title, 90)),
    whyItMatters: shorten('AI summarization is temporarily unavailable, so this view shows a short synthesis from the latest source articles.', 140),
  };
};

const buildFallbackChatAnswer = ({ question, context }) => {
  const normalizedQuestion = String(question || '').toLowerCase();
  const summaryLines = context?.summary?.summary || [];
  const highlights = context?.summary?.highlights || [];
  const whyItMatters = context?.summary?.whyItMatters || '';
  const topTitles = (context?.articles || []).slice(0, 3).map((a) => a.title).filter(Boolean);

  if (normalizedQuestion.includes('beginner')) return whyItMatters || summaryLines[0] || 'This topic matters because it could affect companies, investors, prices, or the broader economy.';
  if (normalizedQuestion.includes('why')) return whyItMatters || highlights[0] || 'The main importance is that this development could influence business sentiment and market decisions.';
  if (normalizedQuestion.includes('highlight') || normalizedQuestion.includes('key')) return highlights.length ? `Key points: ${highlights.slice(0, 3).join(' | ')}` : 'The top signals are reflected in the headlines.';
  if (topTitles.length) return `From the latest coverage: ${topTitles.join(' | ')}`;
  return summaryLines[0] || 'Live AI chat is unavailable right now, but the summary reflects the latest coverage.';
};

const getGeminiText = (response) => (response?.candidates?.[0]?.content?.parts || response?.response?.candidates?.[0]?.content?.parts || []).filter((p) => typeof p.text === 'string').map((p) => p.text).join('\n').trim();
const getChatContent = (content) => typeof content === 'string' ? content.trim() : (Array.isArray(content) ? content.map((p) => typeof p === 'string' ? p : p.text || '').join('\n').trim() : '');
const providerError = (provider, error, fallbackMessage) => { const err = new Error(error?.error?.message || error?.message || fallbackMessage); err.statusCode = error?.status || error?.statusCode || 502; err.provider = provider; return err; };
const logProviderFailure = (kind, error) => { if (error) console.warn(`${kind} provider "${error.provider || 'unknown'}" failed: ${error.message}`); };
const shouldCooldownProvider = (error) => { const message = String(error?.message || '').toLowerCase(); return error?.statusCode === 429 || error?.statusCode === 402 || error?.statusCode === 403 || message.includes('quota') || message.includes('credits') || message.includes('rate limit') || message.includes('too many requests'); };
const setProviderCooldown = (provider, error) => { if (shouldCooldownProvider(error)) providerCooldowns.set(provider, Date.now() + 30 * 60 * 1000); };
const isProviderAvailable = (provider) => Date.now() >= (providerCooldowns.get(provider) || 0);

const tryOpenAIJson = async (prompt) => { const client = getOpenAIClient(); if (!client) return null; const response = await client.chat.completions.create({ model: OPENAI_TEXT_MODEL, response_format: { type: 'json_object' }, max_tokens: SUMMARY_MAX_TOKENS, temperature: 0.2, messages: [{ role: 'system', content: 'You are a business news analyst. Return valid JSON only.' }, { role: 'user', content: prompt }] }); return parseJsonResponse(getChatContent(response.choices?.[0]?.message?.content)); };
const tryGeminiJson = async (prompt) => { const client = getGeminiClient(); if (!client) return null; const response = await client.models.generateContent({ model: GEMINI_TEXT_MODEL, contents: prompt, config: { maxOutputTokens: SUMMARY_MAX_TOKENS } }); return parseJsonResponse(response?.text || response?.response?.text || getGeminiText(response)); };
const tryXAIJson = async (prompt) => { const client = getXAIClient(); if (!client) return null; const response = await client.chat.completions.create({ model: XAI_TEXT_MODEL, max_tokens: SUMMARY_MAX_TOKENS, temperature: 0.2, messages: [{ role: 'system', content: 'You are a business news analyst. Return valid JSON only.' }, { role: 'user', content: prompt }] }); return parseJsonResponse(getChatContent(response.choices?.[0]?.message?.content)); };
const tryOpenRouterJson = async (prompt) => { const client = getOpenRouterClient(); if (!client) return null; const response = await client.chat.completions.create({ model: OPENROUTER_TEXT_MODEL, response_format: { type: 'json_object' }, max_tokens: SUMMARY_MAX_TOKENS, temperature: 0.2, messages: [{ role: 'system', content: 'You are a business news analyst. Return valid JSON only.' }, { role: 'user', content: prompt }] }); return parseJsonResponse(getChatContent(response.choices?.[0]?.message?.content)); };

const tryOpenAIChat = async (prompt) => { const client = getOpenAIClient(); if (!client) return null; const response = await client.chat.completions.create({ model: OPENAI_TEXT_MODEL, max_tokens: CHAT_MAX_TOKENS, temperature: 0.2, messages: [{ role: 'user', content: prompt }] }); return getChatContent(response.choices?.[0]?.message?.content); };
const tryGeminiChat = async (prompt) => { const client = getGeminiClient(); if (!client) return null; const response = await client.models.generateContent({ model: GEMINI_TEXT_MODEL, contents: prompt, config: { maxOutputTokens: CHAT_MAX_TOKENS } }); return getGeminiText(response); };
const tryXAIChat = async (prompt) => { const client = getXAIClient(); if (!client) return null; const response = await client.chat.completions.create({ model: XAI_TEXT_MODEL, max_tokens: CHAT_MAX_TOKENS, temperature: 0.2, messages: [{ role: 'user', content: prompt }] }); return getChatContent(response.choices?.[0]?.message?.content); };
const tryOpenRouterChat = async (prompt) => { const client = getOpenRouterClient(); if (!client) return null; const response = await client.chat.completions.create({ model: OPENROUTER_TEXT_MODEL, max_tokens: CHAT_MAX_TOKENS, temperature: 0.2, messages: [{ role: 'user', content: prompt }] }); return getChatContent(response.choices?.[0]?.message?.content); };

const tryOpenAIImage = async (prompt) => { const client = getOpenAIClient(); if (!client) return null; const response = await client.images.generate({ model: OPENAI_IMAGE_MODEL, prompt, response_format: 'b64_json', size: '1024x1024' }); const image = response.data?.[0]?.b64_json; if (!image) throw new Error('OpenAI did not return an image payload.'); return { imageBase64: image, mimeType: 'image/png' }; };
const tryGeminiImage = async (prompt) => { const client = getGeminiClient(); if (!client) return null; const response = await client.models.generateContent({ model: GEMINI_IMAGE_MODEL, contents: prompt, config: { responseModalities: [Modality.TEXT, Modality.IMAGE] } }); const imagePart = (response.candidates?.[0]?.content?.parts || []).find((part) => part.inlineData?.data); if (!imagePart?.inlineData?.data) throw new Error('Gemini did not return an image payload.'); return { imageBase64: imagePart.inlineData.data, mimeType: imagePart.inlineData.mimeType || 'image/png' }; };
const tryXAIImage = async (prompt) => { const client = getXAIClient(); if (!client) return null; const response = await client.images.generate({ model: XAI_IMAGE_MODEL, prompt, response_format: 'b64_json' }); const image = response.data?.[0]?.b64_json; if (!image) throw new Error('xAI did not return an image payload.'); return { imageBase64: image, mimeType: 'image/png' }; };

const generateNewsSummary = async (articles) => {
  const prompt = `Combine these articles and generate:\n1. Short summary in exactly 5 very short lines\n2. 4 key highlights\n3. Why it matters in 1 short paragraph\nKeep it simple, crisp, and highly compressed.\nDo not rewrite the full news story.\nEach summary line must stay under 18 words.\nEach highlight must stay under 14 words.\nThe why-it-matters section must stay under 40 words.\n\nReturn JSON in this shape:\n{\n  "summary": ["line 1", "line 2", "line 3", "line 4", "line 5"],\n  "highlights": ["point 1", "point 2", "point 3", "point 4"],\n  "whyItMatters": "..."\n}\n\nArticles:\n${formatArticlesForPrompt(articles)}`;
  let lastError;
  for (const provider of TEXT_PROVIDER_ORDER) {
    if (!isProviderAvailable(provider)) continue;
    try {
      if (provider === 'openai') { const result = await tryOpenAIJson(prompt); if (result) return result; }
      if (provider === 'gemini') { const result = await tryGeminiJson(prompt); if (result) return result; }
      if (provider === 'xai') { const result = await tryXAIJson(prompt); if (result) return result; }
      if (provider === 'openrouter') { const result = await tryOpenRouterJson(prompt); if (result) return result; }
    } catch (error) {
      lastError = providerError(provider, error, 'Unable to generate a summary.');
      setProviderCooldown(provider, lastError);
    }
  }
  if (TEXT_PROVIDER_ORDER.length) logProviderFailure('Summary', lastError);
  return buildFallbackSummary(articles);
};

const answerNewsQuestion = async ({ question, context }) => {
  const prompt = `Answer the user question based on this news context. Keep it simple and clear.\n\nQuestion: ${question}\n\nContext:\n${JSON.stringify(context || {}, null, 2)}`;
  let lastError;
  for (const provider of TEXT_PROVIDER_ORDER) {
    if (!isProviderAvailable(provider)) continue;
    try {
      if (provider === 'openai') { const result = await tryOpenAIChat(prompt); if (result) return result; }
      if (provider === 'gemini') { const result = await tryGeminiChat(prompt); if (result) return result; }
      if (provider === 'xai') { const result = await tryXAIChat(prompt); if (result) return result; }
      if (provider === 'openrouter') { const result = await tryOpenRouterChat(prompt); if (result) return result; }
    } catch (error) {
      lastError = providerError(provider, error, 'Unable to answer the question.');
      setProviderCooldown(provider, lastError);
    }
  }
  if (TEXT_PROVIDER_ORDER.length) logProviderFailure('Chat', lastError);
  return buildFallbackChatAnswer({ question, context });
};

const generateNewsImage = async ({ prompt, context }) => {
  if (!IMAGE_PROVIDER_ORDER.length) {
    const error = new Error('AI image generation is currently disabled.');
    error.statusCode = 503;
    throw error;
  }
  const fullPrompt = `${prompt}\n\nCreate a clean editorial-style business news illustration. Keep it modern, informative, and suitable for a financial news dashboard.\n\nContext:\n${JSON.stringify(context || {}, null, 2).slice(0, IMAGE_CONTEXT_LIMIT)}`;
  let lastError;
  for (const provider of IMAGE_PROVIDER_ORDER) {
    if (!isProviderAvailable(provider)) continue;
    try {
      if (provider === 'openai') { const result = await tryOpenAIImage(fullPrompt); if (result) return result; }
      if (provider === 'gemini') { const result = await tryGeminiImage(fullPrompt); if (result) return result; }
      if (provider === 'xai') { const result = await tryXAIImage(fullPrompt); if (result) return result; }
    } catch (error) {
      lastError = providerError(provider, error, 'Unable to generate an image.');
      setProviderCooldown(provider, lastError);
    }
  }
  logProviderFailure('Image', lastError);
  const error = new Error('Image generation is temporarily unavailable.');
  error.statusCode = 429;
  throw error;
};

// Export to CommonJS
module.exports = {
  generateNewsSummary,
  answerNewsQuestion,
  generateNewsImage
};