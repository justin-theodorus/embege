import { useState } from 'react'

const SendIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M12 7L2 7M12 7L8 3M12 7L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function extractQuickMessage (text) {
  if (!text) return { main: null, sub: null }

  const cleaned = text
    .replace(/^#+\s+/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .trim()

  const sentences = cleaned.match(/[^.!?\n]+[.!?]*/g) || []
  const nonEmpty = sentences.map(s => s.trim()).filter(s => s.length > 10)

  const main = nonEmpty[0] ?? null
  const sub = nonEmpty.slice(1, 3).join(' ').trim() || null

  return {
    main: main ? (main.length > 140 ? main.substring(0, 140) + '…' : main) : null,
    sub: sub ? (sub.length > 160 ? sub.substring(0, 160) + '…' : sub) : null,
  }
}

export function GibrainQuickChat ({ briefingText, isLoading, conversationData }) {
  const [input, setInput] = useState('')
  const { main, sub } = extractQuickMessage(briefingText)

  const handleSubmit = (e) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (!trimmed) return

    if (conversationData?.chat) {
      conversationData.chat(trimmed)
    }
    window.dispatchEvent(new CustomEvent('open-gibrain-panel'))
    setInput('')
  }

  return (
    <div className="bg-brand-card rounded-2xl p-5 border border-brand-border shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <img src="/gemini-black.png" alt="Gibrain" className="w-5 h-5 object-contain" />
        <span className="text-brand-muted text-xs font-semibold tracking-wide uppercase">Gibrain</span>
      </div>

      {/* Message */}
      {isLoading ? (
        <div className="space-y-2 mb-4">
          <div className="h-4 bg-brand-bg rounded-full animate-pulse w-3/4" />
          <div className="h-3 bg-brand-bg rounded-full animate-pulse w-1/2" />
        </div>
      ) : main ? (
        <div className="mb-4">
          <p className="text-brand-cream font-semibold text-sm leading-relaxed">{main}</p>
          {sub && <p className="text-brand-muted text-sm mt-1 leading-relaxed">{sub}</p>}
        </div>
      ) : (
        <p className="text-brand-muted text-sm mb-4">Ask me anything about your kitchen, recipes, or groceries.</p>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <div className="flex items-center gap-2 bg-brand-bg rounded-xl px-4 py-2.5 border border-brand-border/60">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask Gibrain a follow-up..."
            className="flex-1 bg-transparent text-sm text-brand-cream placeholder-brand-muted focus:outline-none"
          />
          <button
            type="submit"
            className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
              input.trim()
                ? 'bg-brand-cream text-white hover:bg-brand-green'
                : 'bg-brand-border text-brand-muted'
            }`}
            disabled={!input.trim()}
          >
            <SendIcon />
          </button>
        </div>
      </form>
    </div>
  )
}
