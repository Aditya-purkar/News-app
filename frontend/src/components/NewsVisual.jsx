import NewsImage from './NewsImage';

const NewsVisual = ({ leadArticle, relatedArticles = [] }) => (
  <section className="border border-[#d9c9af] bg-white p-6 shadow-soft">
    <div className="mb-4 flex flex-col gap-3 border-b border-[#eadfcd] pb-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7b5b2e]">News Visuals</p>
        <h2 className="font-display text-3xl text-[#191919]">Related Coverage</h2>
      </div>
      <p className="text-sm text-[#6b5a45]">Auto-picked from live article imagery</p>
    </div>

    {leadArticle ? (
      <div className="grid gap-4">
        <div className="overflow-hidden border border-[#eadfcd] bg-[#fbf8f2]">
          <NewsImage
            src={leadArticle.image}
            alt={leadArticle.title}
            title={leadArticle.title}
            source={leadArticle.source}
            className="h-[320px] w-full object-cover"
            fallbackClassName="h-[320px] w-full"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {relatedArticles.length ? (
            relatedArticles.map((article) => (
                <article key={article.url} className="border border-[#eadfcd] bg-[#fffaf3]">
                  <NewsImage
                    src={article.image}
                    alt={article.title}
                    title={article.title}
                    source={article.source}
                    className="h-28 w-full object-cover"
                    fallbackClassName="h-28 w-full"
                  />
                  <div className="p-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7b5b2e]">
                      {article.source}
                    </p>
                    <p className="mt-2 font-display text-lg leading-6 text-[#191919]">{article.title}</p>
                  </div>
                </article>
              ))
          ) : (
            <div className="border border-[#eadfcd] bg-[#fbf8f2] p-4 text-sm text-[#6b5a45] md:col-span-3">
              More related article images will appear here when the live feed includes them.
            </div>
          )}
        </div>
      </div>
    ) : (
      <div className="flex h-[320px] items-center justify-center border border-[#eadfcd] bg-[#fbf8f2] px-6 text-center text-sm text-[#6b5a45]">
        Visual coverage will appear automatically when the selected news articles include images.
      </div>
    )}
  </section>
);

export default NewsVisual;
