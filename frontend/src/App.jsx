
import React, { useState, useEffect, startTransition } from 'react';
import SearchBar from './components/SearchBar';
import SummaryCard from './components/SummaryCard';
import HighlightsGrid from './components/HighlightsGrid';
import WhyItMatters from './components/WhyItMatters';
import ChatBox from './components/ChatBox';
import ArticleList from './components/ArticleList';
import TrendingTopics from './components/TrendingTopics';
import NewsVisual from './components/NewsVisual';
import Login from './components/Login';
import Register from './components/Register';
import {
  fetchChatAnswer,
  fetchNews,
  fetchSummary,
  fetchTrendingNews,
} from './services/api';

const createMessage = (role, text) => ({
  id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
  role,
  text,
});

const initialSummaryState = {
  summary: [],
  highlights: [],
  whyItMatters: '',
};

function App() {
  // --- AUTHENTICATION STATE ---
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // 'login' or 'register'

  // --- NEWS & AI STATE ---
  const [query, setQuery] = useState('Tesla earnings');
  const [articles, setArticles] = useState([]);
  const [summaryData, setSummaryData] = useState(initialSummaryState);
  const [beginnerText, setBeginnerText] = useState('');
  const [messages, setMessages] = useState([]);
  const [trendingArticles, setTrendingArticles] = useState([]);
  
  // --- LOADING & ERROR STATE ---
  const [loadingNews, setLoadingNews] = useState(false);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingBeginner, setLoadingBeginner] = useState(false);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const hasContext = articles.length > 0 && summaryData.summary.length > 0;
  const leadArticle = articles[0] || trendingArticles[0] || null;

  // --- EFFECTS ---
  
  // 1. Check for existing login session on load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setUser('Premium User'); // We can update this later to decode the JWT and get the real username
    }
  }, []);

  // 2. Load trending news (Only if logged in to save API calls)
  useEffect(() => {
    if (!user) return; 

    const loadTrending = async () => {
      try {
        const data = await fetchTrendingNews();
        setWarning((current) => current || data.warning || '');
        startTransition(() => {
          setTrendingArticles(data.articles || []);
        });
      } catch (requestError) {
        setError(
          requestError.response?.data?.message || 'Unable to load trending topics right now.'
        );
      } finally {
        setLoadingTrending(false);
      }
    };
    loadTrending();
  }, [user]);

  // 3. Run initial search on mount (Only if logged in)
  useEffect(() => {
    if (user) {
      runSearch(query);
    }
  }, [user]);

  // --- HANDLERS ---

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setView('login');
  };

  const runSearch = async (nextQuery) => {
    setLoadingNews(true);
    setLoadingSummary(true);
    setError('');
    setWarning('');
    setBeginnerText('');
    setMessages([]);
    setSummaryData(initialSummaryState);

    try {
      const newsResponse = await fetchNews(nextQuery);
      setWarning(newsResponse.warning || '');
      startTransition(() => {
        setArticles(newsResponse.articles);
      });

      if (!newsResponse.articles?.length) {
        setError('No live articles were found for that topic. Try a broader keyword.');
        return;
      }

      const aiSummary = await fetchSummary(newsResponse.articles);
      startTransition(() => {
        setSummaryData({
          summary: aiSummary.summary || [],
          highlights: aiSummary.highlights || [],
          whyItMatters: aiSummary.whyItMatters || '',
        });
      });
    } catch (requestError) {
      setSummaryData(initialSummaryState);
      setArticles([]);
      setError(
        requestError.response?.data?.message ||
          'Something went wrong while fetching live news or generating the summary.'
      );
    } finally {
      setLoadingNews(false);
      setLoadingSummary(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!query.trim()) {
      setError('Please enter a business topic or company to search.');
      return;
    }
    await runSearch(query.trim());
  };

  const handleAskQuestion = async (question) => {
    const userMessage = createMessage('user', question);
    setMessages((current) => [...current, userMessage]);
    setLoadingChat(true);

    try {
      const response = await fetchChatAnswer({
        question,
        context: { query, summary: summaryData, articles },
      });
      setMessages((current) => [...current, createMessage('assistant', response.answer)]);
    } catch (requestError) {
      setMessages((current) => [
        ...current,
        createMessage(
          'assistant',
          requestError.response?.data?.message || 'I could not answer that question right now.'
        ),
      ]);
    } finally {
      setLoadingChat(false);
    }
  };

  const handleBeginnerMode = async () => {
    setLoadingBeginner(true);
    try {
      const response = await fetchChatAnswer({
        question: 'Explain this news like I am a beginner. Focus on simple concepts and real-world impact.',
        context: { query, summary: summaryData, articles },
      });
      setBeginnerText(response.answer);
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || 'Beginner explanation could not be generated.'
      );
    } finally {
      setLoadingBeginner(false);
    }
  };

  const handleTrendingSelect = async (headline) => {
    setQuery(headline);
    await runSearch(headline);
  };

  // --- RENDERING ---

  // RENDER AUTHENTICATION GATES
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f0e6]">
        {view === 'login' ? (
          <Login onLoginSuccess={(username) => setUser(username)} toggleView={setView} />
        ) : (
          <Register toggleView={setView} />
        )}
      </div>
    );
  }

  // RENDER MAIN DASHBOARD
  return (
    <div className="min-h-screen bg-[#fdfdfc]">
      <div className="border-b border-[#c9b799] bg-[#f6f0e6] flex justify-between items-center px-4 md:px-8">
        <div className="py-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-[#7b5b2e]">
          Markets | Companies | Economy | AI Desk | Live Business Intelligence
        </div>
        <div className="flex items-center gap-4 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7b5b2e]">
          <span>Welcome, {user}</span>
          <button 
            onClick={handleLogout} 
            className="bg-[#d94f2b] text-white px-3 py-1 rounded hover:bg-[#b03d20] transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
        <header className="mb-6 border-b-4 border-[#d94f2b] bg-white px-4 pb-5 pt-4 md:px-8">
          <div className="border-b border-[#d9c9af] pb-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#7b5b2e]">
              ET NewsEra
            </p>
            <h1 className="mt-3 font-display text-4xl leading-none text-[#191919] md:text-6xl">
              Top News with an AI Editor
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-[#54483b] md:text-base">
              A live business news experience inspired by classic financial journalism, with AI
              summaries, context, explainers, and chat layered on top.
            </p>
          </div>

          <div className="mt-4 grid gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#7b5b2e] md:grid-cols-3">
            <div className="border-l-4 border-[#d94f2b] bg-[#fbf6ee] px-4 py-3">
              Real-time search from GNews
            </div>
            <div className="border-l-4 border-[#2563eb] bg-[#fbf6ee] px-4 py-3">
              Multi-provider AI summaries and chat
            </div>
            <div className="border-l-4 border-[#10b981] bg-[#fbf6ee] px-4 py-3">
              Auto visuals from live source coverage
            </div>
          </div>
        </header>

        <div className="grid gap-6">
          <SearchBar query={query} onChange={setQuery} onSubmit={handleSubmit} loading={loadingNews} />
          <TrendingTopics
            articles={trendingArticles}
            onSelect={handleTrendingSelect}
            loading={loadingTrending}
          />

          {error ? (
            <div className="border-l-4 border-[#d94f2b] bg-[#fff2ee] px-5 py-4 text-sm text-[#8a2d18]">
              {error}
            </div>
          ) : null}

          {warning ? (
            <div className="border-l-4 border-[#2563eb] bg-[#eef5ff] px-5 py-4 text-sm text-[#1e40af]">
              {warning}
            </div>
          ) : null}

          <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-6">
              <SummaryCard summary={summaryData.summary} loading={loadingSummary} leadArticle={leadArticle} />
              <HighlightsGrid highlights={summaryData.highlights} articles={articles} />
            </div>
            <div className="grid gap-6">
              <WhyItMatters
                text={summaryData.whyItMatters}
                beginnerText={beginnerText}
                onExplain={handleBeginnerMode}
                loading={loadingBeginner}
                hasContext={hasContext}
                leadArticle={leadArticle}
              />
              <NewsVisual
                leadArticle={leadArticle}
                relatedArticles={articles.slice(1, 4)}
              />
              <ChatBox
                messages={messages}
                onSend={handleAskQuestion}
                loading={loadingChat}
                disabled={!hasContext}
              />
            </div>
          </div>

          <ArticleList
            articles={articles}
            title={articles.length ? `Top ${articles.length} live articles for "${query}"` : 'Source feed'}
          />
        </div>
      </div>
    </div>
  );
}

export default App;