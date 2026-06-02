import NewsImage from './NewsImage';

const WhyItMatters = ({ text, beginnerText, onExplain, loading, hasContext, leadArticle }) => (
  <section className="border border-[#d9c9af] bg-[#fffaf3] p-6 shadow-soft">
    <div className="mb-5 flex flex-col gap-3 border-b border-[#eadfcd] pb-3 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7b5b2e]">Why It Matters</p>
        <h2 className="font-display text-3xl text-[#191919]">Business Impact</h2>
      </div>
      <button
        type="button"
        onClick={onExplain}
        disabled={loading || !hasContext}
        className="border border-[#d6cab8] bg-white px-4 py-3 text-sm font-semibold text-[#191919] transition hover:bg-[#fbf1e3] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Explaining...' : 'Explain Like Beginner'}
      </button>
    </div>

    {leadArticle ? (
      <div className="mb-5 overflow-hidden border border-[#eadfcd]">
        <div className="relative">
          <NewsImage
            src={leadArticle.image}
            alt={leadArticle.title}
            title={leadArticle.title}
            source={leadArticle.source}
            className="h-44 w-full object-cover"
            fallbackClassName="h-44 w-full"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/80">Context Image</p>
            <p className="mt-1 font-display text-xl leading-7 text-white">{leadArticle.title}</p>
          </div>
        </div>
      </div>
    ) : null}

    <p className="text-sm leading-7 text-[#3f3a34]">
      {text || 'Ask AI to summarize a live topic and this section will explain the broader business relevance.'}
    </p>

    {beginnerText ? (
      <div className="mt-5 border-l-4 border-[#10b981] bg-[#f6fbf8] p-5">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#0d8d63]">
          Beginner Mode
        </p>
        <p className="text-sm leading-7 text-[#274239]">{beginnerText}</p>
      </div>
    ) : null}
  </section>
);

export default WhyItMatters;
