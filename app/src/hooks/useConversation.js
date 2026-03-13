import { useState, useCallback, useRef } from 'react'
import { sendMessage } from '../api/elastic'

// Extract the agent's text output from the /converse response.
// Elastic Agent Builder API returns the final text in response.response.message.
// Earlier code assumed response.output (string) or a steps[].type==="message" entry —
// runtime logs showed neither exists; the real field is response.response.message.
export function extractAgentOutput (response) {
  if (!response) return ''
  // Primary path — confirmed by runtime logs (response.response.message)
  if (typeof response.response?.message === 'string' && response.response.message.trim()) {
    return response.response.message.trim()
  }
  // Secondary path — response.response may itself be a plain string
  if (typeof response.response === 'string' && response.response.trim()) {
    return response.response.trim()
  }
  // Legacy fallbacks for any future API shape changes
  if (typeof response.output === 'string' && response.output.trim()) return response.output
  if (Array.isArray(response.steps)) {
    const messageSteps = response.steps.filter(s => s.type === 'message' || s.type === 'text')
    if (messageSteps.length > 0) {
      const last = messageSteps[messageSteps.length - 1]
      return last.content ?? last.text ?? last.message ?? ''
    }
  }
  if (typeof response === 'string') return response
  return ''
}

export function useConversation () {
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  // Track conversation ID in a ref so sendMessage closures always see the latest value
  const conversationIdRef = useRef(null)

  const chat = useCallback(async (userMessage) => {
    const userMsg = { role: 'user', content: userMessage, id: Date.now() }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setError(null)

    try {
      // Pass current conversationId (null on first message — API auto-creates the conversation)
      const response = await sendMessage(conversationIdRef.current, userMessage)

      // Capture conversation_id from first response and reuse it for all subsequent messages
      const returnedConvId = response.conversation_id ?? response.conversationId ?? null
      if (returnedConvId && !conversationIdRef.current) {
        conversationIdRef.current = returnedConvId
        setConversationId(returnedConvId)
      }

      const assistantContent = extractAgentOutput(response)

      const assistantMsg = {
        role: 'assistant',
        content: assistantContent,
        id: Date.now() + 1,
      }
      setMessages(prev => [...prev, assistantMsg])
      return assistantMsg
    } catch (err) {
      console.error('chat error:', err)
      setError('Failed to get response from Gibrain.')
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  const addSystemMessage = useCallback((content) => {
    setMessages(prev => [...prev, { role: 'system', content, id: Date.now() }])
  }, [])

  const addAssistantMessage = useCallback((content) => {
    setMessages(prev => [...prev, { role: 'assistant', content, id: Date.now() }])
  }, [])

  const clearError = useCallback(() => setError(null), [])

  return { conversationId, messages, isLoading, error, chat, addSystemMessage, addAssistantMessage, clearError }
}
