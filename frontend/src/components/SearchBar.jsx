const quickTopics = ['Nvidia', 'Tesla', 'Apple', 'Inflation', 'IPO'];

const SearchBar = ({ query, onChange, onSubmit, loading }) => (
  <form onSubmit={onSubmit} className="border border-[#d9c9af] bg-white p-4 shadow-soft">
    <div className="mb-3 flex items-center justify-between gap-4 border-b border-[#eadfcd] pb-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7b5b2e]">
          Search the Newsroom
        </p>
        <h2 className="font-display text-2xl text-[#191919]">Track a company, sector, or market theme</h2>
      </div>
      <div className="hidden text-right text-xs text-[#6b5a45] md:block">
        Business headlines refreshed from live sources
      </div>
    </div>

    <div className="flex flex-col gap-3 md:flex-row">
      <input
        type="text"
        value={query}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Search live business news, stocks, companies, markets..."
        className="min-h-14 flex-1 border border-[#d6cab8] bg-[#fbf8f2] px-4 text-base text-[#191919] outline-none transition focus:border-[#d94f2b] focus:bg-white"
      />
      <button
        type="submit"
        disabled={loading}
        className="min-h-14 bg-[#d94f2b] px-6 font-semibold text-white transition hover:bg-[#bf3f20] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? 'Searching...' : 'Search News'}
      </button>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {quickTopics.map((topic) => (
        <button
          key={topic}
          type="button"
          onClick={() => onChange(topic)}
          className="border border-[#d6cab8] bg-[#fbf8f2] px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7b5b2e] transition hover:border-[#d94f2b] hover:bg-[#fff3ea]"
        >
          {topic}
        </button>
      ))}
    </div>
  </form>
);

export default SearchBar;
