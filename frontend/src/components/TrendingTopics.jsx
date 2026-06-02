import NewsImage from './NewsImage';

const TrendingTopics = ({ articles, onSelect, loading }) => (
  <section className="border border-[#d9c9af] bg-white p-6 shadow-soft">
    <div className="mb-4 flex items-center justify-between border-b border-[#eadfcd] pb-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7b5b2e]">Trending Topics</p>
        <h2 className="font-display text-3xl text-[#191919]">Top Business Headlines</h2>
      </div>
      {loading ? <span className="text-sm text-[#6b5a45]">Refreshing...</span> : null}
    </div>

    <div className="grid gap-0 border-t border-[#eadfcd] md:grid-cols-2 xl:grid-cols-3">
      {loading ? (
        Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="border-b border-[#eadfcd] p-4 md:border-r xl:[&:nth-child(3n)]:border-r-0"
          >
            <div className="h-3 w-20 animate-pulse bg-[#e8dcc6]" />
            <div className="mt-4 h-5 w-full animate-pulse bg-[#f1e7d7]" />
            <div className="mt-2 h-5 w-4/5 animate-pulse bg-[#f1e7d7]" />
          </div>
        ))
      ) : articles?.length ? (
        articles.map((article) => (
          <button
            key={article.url}
            type="button"
            onClick={() => onSelect(article.title)}
            className="border-b border-[#eadfcd] p-4 text-left transition hover:bg-[#fbf6ee] md:border-r xl:[&:nth-child(3n)]:border-r-0"
          >
            <NewsImage
              src={article.image}
              alt={article.title}
              title={article.title}
              source={article.source}
              className="mb-3 h-36 w-full object-cover"
              fallbackClassName="mb-3 h-36 w-full"
            />
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b5b2e]">
              {article.source}
            </p>
            <p className="font-display text-xl leading-7 text-[#191919]">{article.title}</p>
          </button>
        ))
      ) : (
        <p className="text-sm text-[#6b5a45]">Trending topics are loading from the live news feed.</p>
      )}
    </div>
  </section>
);

export default TrendingTopics;
