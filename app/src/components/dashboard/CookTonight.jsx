import { Link } from 'react-router-dom'

const ArrowIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M2.5 11.5L11.5 2.5M11.5 2.5H5M11.5 2.5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

function parseRecipeFromBriefing (text) {
  if (!text) return { name: null, savings: null }

  const sectionMatch = text.match(/Tonight(?:'s)?\s+Dinner\s+Recommendation[^\n]*\n+\*\*([^*\n]+)\*\*/i)
  const boldFallback = text.match(/\*\*([A-Z][^*\n]{5,60})\*\*/)
  const name = sectionMatch?.[1]?.trim() ?? boldFallback?.[1]?.trim() ?? null

  const savingsMatch = text.match(/[Ss]ave[^\d$]*\$(\d+\.?\d*)/i)
  const savings = savingsMatch ? parseFloat(savingsMatch[1]) : null

  return { name, savings }
}

export function CookTonight ({ briefingText }) {
  const { name, savings } = parseRecipeFromBriefing(briefingText)

  return (
    <div className="flex flex-col gap-3">
      {/* Food image card with overlay */}
      <div className="relative rounded-2xl overflow-hidden" style={{ minHeight: '260px' }}>
        <img
          src="/food.jpg"
          alt="Tonight's recipe"
          className="w-full h-full object-cover absolute inset-0"
          style={{ minHeight: '260px' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />

        {/* Top labels */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          <div>
            <p className="text-white/70 text-xs font-medium tracking-wide">Cook Tonight</p>
          </div>
          <span className="text-white/60 text-xs">✦ AI Recommendation</span>
        </div>

        {/* Bottom content */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="flex gap-2 mb-2.5">
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="text-green-300 text-xs">✓</span>
              <span>All ingredients</span>
            </span>
            <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">
              30 mins
            </span>
          </div>
          <div className="flex items-end justify-between gap-2">
            <h3 className="text-white font-bold text-xl leading-tight">
              {name ?? 'Loading…'}
            </h3>
            <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0 text-white">
              <ArrowIcon />
            </div>
          </div>
        </div>
      </div>

      {/* See all recipes link */}
      <Link
        to="/recipes"
        className="text-brand-muted text-xs hover:text-brand-green transition-colors flex items-center gap-1"
      >
        See all recipes
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
    </div>
  )
}
