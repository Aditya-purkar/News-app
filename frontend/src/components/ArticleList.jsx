import NewsImage from './NewsImage';

const formatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const formatDate = (value) => formatter.format(new Date(value));

const ArticleList = ({ articles, title }) => (
  <section className="border border-[#d9c9af] bg-white p-6 shadow-soft">
    <div className="mb-5 border-b border-[#eadfcd] pb-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7b5b2e]">Live Articles</p>
      <h2 className="font-display text-3xl text-[#191919]">{title}</h2>
    </div>

    <div className="space-y-4">
      {articles?.length ? (
        articles.map((article) => (
          <article
            key={article.url}
            className="overflow-hidden border border-[#eadfcd] bg-[#fffdf8] md:grid md:grid-cols-[220px_1fr]"
          >
            <div className="h-44 bg-[#efe3d0] md:h-full">
              <NewsImage
                src={article.image}
                alt={article.title}
                title={article.title}
                source={article.source}
                className="h-full w-full object-cover"
                fallbackClassName="h-full w-full"
              />
            </div>
            <div className="p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-[#7b5b2e]">
                <span>{article.source}</span>
                <span className="h-1 w-1 rounded-full bg-[#bda27a]" />
                <span>{formatDate(article.publishedAt)}</span>
              </div>
              <h3 className="mb-3 font-display text-[30px] leading-9 text-[#191919]">{article.title}</h3>
              <p className="mb-4 text-sm leading-7 text-[#4d463d]">
                {article.description || 'No description was provided by the source.'}
              </p>
              <a
                href={article.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center border-b-2 border-[#d94f2b] pb-1 text-sm font-semibold text-[#191919] transition hover:text-[#d94f2b]"
              >
                Read source
              </a>
            </div>
          </article>
        ))
      ) : (
        <p className="text-sm text-[#6b5a45]">Live articles will appear here after a search.</p>
      )}
    </div>
  </section>
);

export default ArticleList;
