import { GibrainChat } from './GibrainChat'

export function ChatPage ({ conversationData }) {
  return (
    <div className="flex flex-col h-screen max-h-screen">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-brand-border bg-brand-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-green flex items-center justify-center overflow-hidden">
            <img src="/gemini-white.png" alt="Gibrain" className="w-6 h-6 object-contain" />
          </div>
          <div>
            <h1 className="text-brand-cream font-bold text-lg">Gibrain</h1>
            <p className="text-brand-muted text-xs">Agentic Kitchen Co-Pilot · Powered by Bedrock Claude</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
            <span className="text-brand-muted text-xs">Active</span>
          </div>
        </div>
      </div>

      {/* Info bar */}
      <div className="flex-shrink-0 px-6 py-2 bg-brand-greenMuted border-b border-brand-green/30">
        <p className="text-brand-greenDark text-xs">
          ✦ Gibrain autonomously chains 4+ tools per request · Uses 6 ES|QL tools · Bedrock Claude Sonnet
        </p>
      </div>

      {/* Chat */}
      <div className="flex-1 min-h-0">
        <GibrainChat conversationData={conversationData} />
      </div>
    </div>
  )
}
