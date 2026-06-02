import NewsImage from './NewsImage';

const SummaryCard = ({ summary, loading, leadArticle }) => (
  <section className="border border-[#d9c9af] bg-white p-6 shadow-soft">
    <div className="mb-5 flex items-center justify-between border-b border-[#eadfcd] pb-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7b5b2e]">AI Summary</p>
        <h2 className="font-display text-3xl text-[#191919]">The Morning Brief</h2>
      </div>
      {loading ? <span className="text-sm text-[#6b5a45]">Analyzing...</span> : null}
    </div>

    {leadArticle ? (
      <div className="mb-5 overflow-hidden border border-[#eadfcd] bg-[#fbf8f2]">
        <NewsImage
          src={leadArticle.image}
          alt={leadArticle.title}
          title={leadArticle.title}
          source={leadArticle.source}
          className="h-[280px] w-full object-cover"
          fallbackClassName="h-[280px] w-full"
          eager
        />
        <div className="border-t border-[#eadfcd] bg-[#fffaf3] px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b5b2e]">
            Lead Visual
          </p>
          <p className="mt-1 font-display text-xl leading-7 text-[#191919]">{leadArticle.title}</p>
        </div>
      </div>
    ) : null}

    {summary?.length ? (
      <div className="space-y-4 text-sm leading-8 text-[#3f3a34]">
        {summary.map((line, index) => (
          <p key={`${line}-${index}`} className="border-l-2 border-[#d94f2b] pl-4 text-[15px]">
            <span className="mr-2 font-semibold text-[#7b5b2e]">0{index + 1}</span>
            {line}
          </p>
        ))}
      </div>
    ) : (
      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-6 animate-pulse bg-[#f1e7d7]" />
          ))
        ) : (
          <p className="text-sm text-[#6b5a45]">Search for a topic to generate an AI digest.</p>
        )}
      </div>
    )}
  </section>
);

export default SummaryCard;
