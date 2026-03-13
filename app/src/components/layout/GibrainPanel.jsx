import { useState, useEffect } from 'react'
import { GibrainChat } from '../chat/GibrainChat'

export function GibrainPanel ({ conversationData }) {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handler = () => setIsOpen(true)
    window.addEventListener('open-gibrain-panel', handler)
    return () => window.removeEventListener('open-gibrain-panel', handler)
  }, [])

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={`fixed right-5 bottom-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all duration-200 ${
          isOpen
            ? 'bg-brand-green text-white'
            : 'bg-brand-card border border-brand-border text-brand-cream hover:bg-brand-cardHover shadow-md'
        }`}
      >
        <img
          src={isOpen ? '/gemini-white.png' : '/gemini-black.png'}
          alt="Gibrain"
          className="w-4 h-4 object-contain"
        />
        <span className="text-sm font-medium">{isOpen ? 'Close' : 'Ask Gibrain'}</span>
        {!isOpen && <span className="text-brand-muted text-xs font-normal ml-0.5">2.3</span>}
      </button>

      {/* Slide-in panel */}
      <div
        className={`fixed right-0 top-0 h-full z-30 flex flex-col bg-white border-l border-brand-border shadow-2xl transition-all duration-300 ${
          isOpen ? 'w-[360px] translate-x-0' : 'w-0 translate-x-full overflow-hidden'
        }`}
      >
        {isOpen && (
          <div className="flex flex-col h-full w-[360px]">
            {/* Panel header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-brand-green flex items-center justify-center">
                  <img src="/gemini-white.png" alt="Gibrain" className="w-5 h-5 object-contain" />
                </div>
                <div>
                  <div className="text-brand-cream font-semibold text-sm">Gibrain</div>
                  <div className="text-brand-muted text-xs">Kitchen Co-Pilot</div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-brand-muted hover:text-brand-cream transition-colors p-1 rounded-lg hover:bg-brand-bg"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            {/* Chat content */}
            <div className="flex-1 min-h-0">
              <GibrainChat conversationData={conversationData} compact />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
