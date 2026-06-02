import { useState } from 'react';

const ChatMessage = ({ role, text }) => {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-xl px-4 py-3 text-sm leading-7 ${
          isUser ? 'bg-[#d94f2b] text-white' : 'border-l-2 border-[#d9c9af] bg-[#fbf8f2] text-[#3f3a34]'
        }`}
      >
        {text}
      </div>
    </div>
  );
};

const ChatBox = ({ messages, onSend, loading, disabled }) => {
  const [draft, setDraft] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!draft.trim()) {
      return;
    }

    const currentDraft = draft;
    setDraft('');
    await onSend(currentDraft);
  };

  return (
    <section className="border border-[#d9c9af] bg-white p-6 shadow-soft">
      <div className="mb-4 border-b border-[#eadfcd] pb-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#7b5b2e]">News Chat</p>
        <h2 className="font-display text-3xl text-[#191919]">Editor&apos;s Desk</h2>
      </div>

      <div className="mb-4 flex h-[360px] flex-col gap-3 overflow-y-auto border border-[#eadfcd] bg-[#fffdf8] p-4">
        {messages.length ? (
          messages.map((message) => (
            <ChatMessage key={message.id} role={message.role} text={message.text} />
          ))
        ) : (
          <div className="flex h-full items-center justify-center text-center text-sm text-[#6b5a45]">
            Ask questions about the current news summary once you run a search.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 md:flex-row">
        <input
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="What does this mean for investors, customers, or the economy?"
          disabled={disabled || loading}
          className="min-h-14 flex-1 border border-[#d6cab8] bg-[#fbf8f2] px-4 text-sm text-[#191919] outline-none transition focus:border-[#d94f2b] focus:bg-white disabled:cursor-not-allowed disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={disabled || loading}
          className="min-h-14 bg-[#1d4ed8] px-5 font-semibold text-white transition hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Thinking...' : 'Send'}
        </button>
      </form>
    </section>
  );
};

export default ChatBox;
