import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { ActionButton } from './ActionButton'

// Parse agent text to extract action proposals and render as buttons
// Looks for lines starting with ➕ ✅ 🗑️ 📝
function parseMessageContent (text) {
  const lines = text.split('\n')
  const segments = []
  let textBuffer = []

  const ACTION_PATTERNS = [
    { emoji: '➕', type: 'add_grocery' },
    { emoji: '✅', type: 'remove_pantry' },
    { emoji: '🗑️', type: 'log_waste' },
    { emoji: '📝', type: 'mark_bought' },
  ]

  for (const line of lines) {
    let matched = false
    for (const { emoji, type } of ACTION_PATTERNS) {
      if (line.trimStart().startsWith(emoji)) {
        if (textBuffer.length > 0) {
          segments.push({ kind: 'text', content: textBuffer.join('\n') })
          textBuffer = []
        }
        const labelText = line.replace(emoji, '').trim()
        segments.push({
          kind: 'action',
          action: {
            type,
            label: labelText,
            item: { name: labelText.replace(/^Add\s+/i, '').split(' ')[0], category: 'other', quantity: 1, unit: 'pieces' },
          },
        })
        matched = true
        break
      }
    }
    if (!matched) textBuffer.push(line)
  }

  if (textBuffer.length > 0) {
    segments.push({ kind: 'text', content: textBuffer.join('\n') })
  }

  return segments
}

function MessageBubble ({ message, onActionComplete }) {
  const isUser = message.role === 'user'
  const isSystem = message.role === 'system'

  if (isSystem) {
    return (
      <div className="px-1 py-1">
        <div className="bg-brand-greenMuted border border-brand-green rounded-lg px-3 py-2">
          <p className="text-brand-greenLight text-xs font-medium">✓ {message.content}</p>
        </div>
      </div>
    )
  }

  if (isUser) {
    return (
      <div className="flex justify-end px-1 py-1">
        <div className="bg-brand-green text-white rounded-xl rounded-br-sm px-4 py-2.5 max-w-[80%]">
          <p className="text-sm">{message.content}</p>
        </div>
      </div>
    )
  }

  // Assistant message — parse for action buttons
  const segments = parseMessageContent(message.content)

  return (
    <div className="flex gap-2 px-1 py-1">
      <div className="w-7 h-7 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden">
        <img src="/gemini-white.png" alt="Gibrain" className="w-4 h-4 object-contain" />
      </div>
      <div className="flex-1 min-w-0 bg-brand-card border border-brand-border rounded-xl rounded-tl-sm p-3 flex flex-col gap-2">
        {segments.map((seg, i) => {
          if (seg.kind === 'text') {
            return (
              <div key={i} className="chat-markdown text-sm leading-relaxed">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => <p className="text-brand-cream font-bold text-sm mb-1">{children}</p>,
                    h2: ({ children }) => <p className="text-brand-cream font-semibold text-sm mt-2 mb-1">{children}</p>,
                    h3: ({ children }) => <p className="text-brand-cream font-semibold text-xs mt-1.5 mb-0.5">{children}</p>,
                    p: ({ children }) => <p className="text-brand-cream mb-1.5 last:mb-0">{children}</p>,
                    strong: ({ children }) => <strong className="text-brand-cream font-semibold">{children}</strong>,
                    em: ({ children }) => <em className="text-brand-muted">{children}</em>,
                    ul: ({ children }) => <ul className="space-y-0.5 my-1 pl-3">{children}</ul>,
                    ol: ({ children }) => <ol className="space-y-0.5 my-1 pl-3 list-decimal">{children}</ol>,
                    li: ({ children }) => <li className="text-brand-cream text-sm flex gap-1.5"><span className="text-brand-green mt-1 text-xs">•</span><span>{children}</span></li>,
                    code: ({ children }) => <code className="bg-brand-bg text-brand-greenLight text-xs px-1 py-0.5 rounded font-mono">{children}</code>,
                    hr: () => <hr className="border-brand-border my-2" />,
                  }}
                >
                  {seg.content}
                </ReactMarkdown>
              </div>
            )
          }
          return (
            <ActionButton
              key={i}
              action={seg.action}
              onComplete={(msg) => onActionComplete?.(msg)}
            />
          )
        })}
      </div>
    </div>
  )
}

function TypingIndicator () {
  return (
    <div className="flex gap-2 px-1 py-1">
      <div className="w-7 h-7 rounded-full bg-brand-green flex items-center justify-center flex-shrink-0 overflow-hidden">
        <img src="/gemini-white.png" alt="Gibrain" className="w-4 h-4 object-contain" />
      </div>
      <div className="bg-brand-card border border-brand-border rounded-xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-brand-muted animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function GibrainChat ({ conversationData, compact = false }) {
  const { messages, isLoading, error, chat, addSystemMessage } = conversationData
  const [input, setInput] = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  const handleSend = async () => {
    const text = input.trim()
    if (!text || isLoading) return
    setInput('')
    await chat(text)
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleActionComplete = (msg) => {
    addSystemMessage(msg)
  }

  const displayMessages = messages.length === 0 ? [] : messages

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-1 min-h-0">
        {displayMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4">
            <div className="w-16 h-16 rounded-2xl bg-brand-green flex items-center justify-center">
              <img src="/gemini-white.png" alt="Gibrain" className="w-9 h-9 object-contain" />
            </div>
            <p className="text-brand-muted text-sm">
              Hi! I'm Gibrain, your kitchen co-pilot. I'm already analyzing your pantry for today's briefing.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['What\'s expiring soon?', 'What should I cook tonight?', 'Check my grocery list'].map(q => (
                <button
                  key={q}
                  onClick={() => chat(q)}
                  className="text-xs px-3 py-1.5 bg-brand-bg border border-brand-border text-brand-cream rounded-full hover:border-brand-green hover:text-brand-green transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {displayMessages.map(msg => (
          <MessageBubble
            key={msg.id}
            message={msg}
            onActionComplete={handleActionComplete}
          />
        ))}

        {isLoading && <TypingIndicator />}

        {error && (
          <div className="mx-2 px-3 py-2 bg-expiry-todayBg border border-red-200 rounded-lg text-red-600 text-xs">
            {error}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={`flex-shrink-0 border-t border-brand-border p-3 ${compact ? '' : 'p-4'}`}>
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask Gibrain anything..."
            rows={1}
            className="flex-1 bg-brand-bg border border-brand-border rounded-xl px-3 py-2.5 text-sm text-brand-cream placeholder-brand-muted resize-none focus:outline-none focus:border-brand-green transition-colors"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-brand-green hover:bg-brand-greenLight disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 8L2.5 2l3 6-3 6 11-6z" fill="white" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
