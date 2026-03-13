import { useState, useEffect, useRef } from 'react'
import { requestBriefing } from '../api/elastic'
import { extractAgentOutput } from './useConversation'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Module-level cache — survives component unmounts across page navigations.
// This means navigating away and back to the dashboard instantly reuses the
// briefing without hitting the Elasticsearch agent again.
const briefingCache = {
  text: null,
  fetchedAt: null,
  systemMessageAdded: false,
  fetchInProgress: false,
}

export function invalidateBriefingCache () {
  briefingCache.text = null
  briefingCache.fetchedAt = null
  briefingCache.systemMessageAdded = false
}

function isCacheFresh () {
  return (
    briefingCache.text !== null &&
    briefingCache.fetchedAt !== null &&
    Date.now() - briefingCache.fetchedAt < CACHE_TTL
  )
}

export function useBriefing ({ addAssistantMessage }) {
  const fresh = isCacheFresh()
  const [briefingText, setBriefingText] = useState(fresh ? briefingCache.text : null)
  const [briefingLoading, setBriefingLoading] = useState(!fresh)
  const [briefingError, setBriefingError] = useState(null)
  // Prevents double-fetch within the same component instance (React StrictMode)
  const fetchStarted = useRef(false)

  useEffect(() => {
    if (isCacheFresh()) {
      setBriefingText(briefingCache.text)
      setBriefingLoading(false)
      // Seed the chat panel with the briefing if not done yet this session
      if (!briefingCache.systemMessageAdded && addAssistantMessage) {
        addAssistantMessage(briefingCache.text)
        briefingCache.systemMessageAdded = true
      }
      return
    }

    // Guard against concurrent fetches from StrictMode double-invocation or
    // two dashboard mounts happening simultaneously
    if (fetchStarted.current || briefingCache.fetchInProgress) return
    fetchStarted.current = true
    briefingCache.fetchInProgress = true

    async function loadBriefing () {
      try {
        const response = await requestBriefing(null)
        const content = extractAgentOutput(response)

        briefingCache.text = content
        briefingCache.fetchedAt = Date.now()
        briefingCache.fetchInProgress = false

        setBriefingText(content)

        if (addAssistantMessage && !briefingCache.systemMessageAdded) {
          addAssistantMessage(content)
          briefingCache.systemMessageAdded = true
        }
      } catch (err) {
        console.error('Briefing error:', err)
        briefingCache.fetchInProgress = false
        setBriefingError('Gibrain could not load the briefing. Showing live pantry data below.')
      } finally {
        setBriefingLoading(false)
      }
    }

    loadBriefing()
  }, [addAssistantMessage])

  return { briefingText, briefingLoading, briefingError }
}
