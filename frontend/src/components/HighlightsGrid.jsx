import NewsImage from './NewsImage';

const HighlightsGrid = ({ highlights, articles = [] }) => (
  <section className="border border-[#d9c9af] bg-white p-6 shadow-soft">
    <div className="mb-5 border-b border-[#eadfcd] pb-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7b5b2e]">Key Highlights</p>
      <h2 className="font-display text-3xl text-[#191919]">Market Signals</h2>
    </div>

    {highlights?.length ? (
      <div className="grid gap-0 border-t border-[#eadfcd] md:grid-cols-2">
        {highlights.map((highlight, index) => (
          <article
            key={`${highlight}-${index}`}
            className="border-b border-[#eadfcd] p-5 md:border-r even:md:border-r-0"
          >
            {articles[index] ? (
              <NewsImage
                src={articles[index].image}
                alt={articles[index].title}
                title={articles[index].title}
                source={articles[index].source}
                className="mb-4 h-32 w-full object-cover"
                fallbackClassName="mb-4 h-32 w-full"
              />
            ) : null}
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[#7b5b2e]">
              Highlight {index + 1}
            </p>
            <p className="text-sm leading-7 text-[#3f3a34]">{highlight}</p>
          </article>
        ))}
      </div>
    ) : (
      <p className="text-sm text-[#6b5a45]">Highlights will appear after AI processing completes.</p>
    )}
  </section>
);

export default HighlightsGrid;
