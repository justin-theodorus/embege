import { useBriefing } from '../../hooks/useBriefing'
import { usePantryData } from '../../hooks/usePantryData'
import { ExpiringCards } from './ExpiringCards'
import { CookTonight } from './CookTonight'
import { GrocerySummary } from './GrocerySummary'
import { ProgressWidget } from './ProgressWidget'
import { GibrainQuickChat } from '../shared/GibrainQuickChat'

function LoadingState () {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
      <div className="w-16 h-16 rounded-2xl bg-brand-green flex items-center justify-center animate-pulse">
        <img src="/gemini-white.png" alt="Gibrain" className="w-9 h-9 object-contain" />
      </div>
      <div className="text-center">
        <p className="text-brand-cream font-semibold text-lg">Gibrain is analyzing your kitchen…</p>
        <p className="text-brand-muted text-sm mt-1">Checking expiring items, finding recipes, and reviewing your grocery list</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-brand-green animate-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  )
}

export function DashboardPage ({ conversationData }) {
  const { addAssistantMessage } = conversationData
  const { expiringItems, isLoading: pantryLoading } = usePantryData()
  const { briefingText, briefingLoading, briefingError } = useBriefing({ addAssistantMessage })

  const isLoading = briefingLoading || pantryLoading

  return (
    <div className="p-6">
      {/* Gibrain AI Quick Chat */}
      <div className="mb-6">
        <GibrainQuickChat
          briefingText={briefingError ? null : briefingText}
          isLoading={briefingLoading}
          conversationData={conversationData}
        />
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Inventory / Expiring items */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-brand-cream font-semibold text-lg">Inventory</h2>
                <p className="text-brand-muted text-sm">
                  {expiringItems.length > 0
                    ? `You have ${expiringItems.length} items expiring soon`
                    : 'All items are fresh — great job!'}
                </p>
              </div>
              <span className="text-brand-muted text-xs">
                ${expiringItems.reduce((sum, i) => sum + (i.price_sgd ?? 0), 0).toFixed(2)} SGD at stake
              </span>
            </div>
            <ExpiringCards items={expiringItems} />
          </section>

          {/* Three-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <CookTonight briefingText={briefingText} />
            <GrocerySummary />
            <ProgressWidget />
          </div>
        </div>
      )}
    </div>
  )
}
