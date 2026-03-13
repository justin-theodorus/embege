const ELASTIC_URL = import.meta.env.VITE_ELASTIC_URL
const KIBANA_URL = import.meta.env.VITE_KIBANA_URL || ELASTIC_URL.replace('.es.', '.kb.').replace(':443', '')
const API_KEY = import.meta.env.VITE_ELASTIC_API_KEY
const AGENT_ID = import.meta.env.VITE_AGENT_ID || 'gibrain-kitchen-assistant'

// In dev, route through the Vite proxy to avoid CORS issues.
// Agent Builder API lives on Kibana endpoint; direct ES data calls go to ES endpoint.
const AGENT_BASE_URL = import.meta.env.DEV ? '/kb-proxy' : KIBANA_URL
const ES_BASE_URL = import.meta.env.DEV ? '/es-proxy' : ELASTIC_URL

const agentHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `ApiKey ${API_KEY}`,
  'kbn-xsrf': 'true',
}

const esHeaders = {
  'Content-Type': 'application/json',
  'Authorization': `ApiKey ${API_KEY}`,
}

// ── Agent Builder API ──
// Real API: POST /api/agent_builder/converse  { input, agent_id, conversation_id? }
// No separate "create conversation" step — first call auto-creates and returns conversation_id.

export async function sendMessage (conversationId, message) {
  const url = `${AGENT_BASE_URL}/api/agent_builder/converse`
  const body = { input: message, agent_id: AGENT_ID }
  if (conversationId) body.conversation_id = conversationId
  const res = await fetch(url, {
    method: 'POST',
    headers: agentHeaders,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`sendMessage failed: ${res.status}`)
  return res.json()
}

// Kept for backwards compat — no longer creates a conversation, just returns a sentinel
export async function createConversation () {
  return { id: null }
}

export async function requestBriefing (conversationId = null) {
  return sendMessage(
    conversationId,
    'Generate today\'s kitchen briefing for Bach Lil. ' +
    'Check what\'s expiring in the next 3 days, suggest what to cook tonight ' +
    'using those expiring items, and check the grocery list status. ' +
    'Prioritize recipes where we already have most ingredients. ' +
    'Include dollar amounts at risk and potential savings.'
  )
}

// ── Direct ES writes (action execution) ──

export async function addToGroceryList (item) {
  const doc = {
    id: `G-${Date.now()}`,
    item_name: item.name,
    category: item.category || 'other',
    quantity: item.quantity || 1,
    unit: item.unit || 'pieces',
    status: 'pending',
    priority: item.priority || 'medium',
    added_by: 'Gibrain',
    bought_by: null,
    added_date: new Date().toISOString().split('T')[0],
    notes: item.notes || '',
  }
  const res = await fetch(`${ES_BASE_URL}/grocery-list/_doc/${doc.id}`, {
    method: 'PUT',
    headers: esHeaders,
    body: JSON.stringify(doc),
  })
  if (!res.ok) throw new Error(`addToGroceryList failed: ${res.status}`)
  return res.json()
}

export async function removeFromPantry (itemId) {
  const res = await fetch(`${ES_BASE_URL}/pantry-items/_doc/${itemId}`, {
    method: 'DELETE',
    headers: esHeaders,
  })
  if (!res.ok) throw new Error(`removeFromPantry failed: ${res.status}`)
  return res.json()
}

export async function logWaste (item) {
  const doc = {
    id: `W-${Date.now()}`,
    item_name: item.name,
    category: item.category,
    quantity_wasted: item.quantity,
    unit: item.unit,
    reason: item.reason || 'expired',
    purchase_price_sgd: item.price_sgd,
    wasted_date: new Date().toISOString().split('T')[0],
    could_have_been_used: true,
    week_number: Math.ceil(new Date().getDate() / 7),
  }
  const res = await fetch(`${ES_BASE_URL}/waste-log/_doc/${doc.id}`, {
    method: 'PUT',
    headers: esHeaders,
    body: JSON.stringify(doc),
  })
  if (!res.ok) throw new Error(`logWaste failed: ${res.status}`)
  return res.json()
}

export async function markGroceryBought (itemId, boughtBy) {
  const res = await fetch(`${ES_BASE_URL}/grocery-list/_update/${itemId}`, {
    method: 'POST',
    headers: esHeaders,
    body: JSON.stringify({ doc: { status: 'bought', bought_by: boughtBy } }),
  })
  if (!res.ok) throw new Error(`markGroceryBought failed: ${res.status}`)
  return res.json()
}

export async function addPantryItem (item) {
  const res = await fetch(`${ES_BASE_URL}/pantry-items/_doc/${item.id}`, {
    method: 'PUT',
    headers: esHeaders,
    body: JSON.stringify(item),
  })
  if (!res.ok) throw new Error(`addPantryItem failed: ${res.status}`)
  return res.json()
}

// ── Direct ES reads (non-agent pages / fallback) ──

export async function fetchExpiringItems (maxDays = 3) {
  const res = await fetch(`${ES_BASE_URL}/pantry-items/_search`, {
    method: 'POST',
    headers: esHeaders,
    body: JSON.stringify({
      query: { range: { days_until_expiry: { lte: maxDays } } },
      sort: [{ days_until_expiry: 'asc' }],
      size: 10,
    }),
  })
  if (!res.ok) throw new Error(`fetchExpiringItems failed: ${res.status}`)
  const data = await res.json()
  return data.hits?.hits?.map(h => h._source) ?? []
}

export async function fetchAllPantryItems () {
  const res = await fetch(`${ES_BASE_URL}/pantry-items/_search`, {
    method: 'POST',
    headers: esHeaders,
    body: JSON.stringify({
      query: { match_all: {} },
      sort: [{ expiry_date: 'asc' }],
      size: 100,
    }),
  })
  if (!res.ok) throw new Error(`fetchAllPantryItems failed: ${res.status}`)
  const data = await res.json()
  return data.hits?.hits?.map(h => ({ ...h._source, _id: h._id })) ?? []
}

export async function fetchGroceryList () {
  const res = await fetch(`${ES_BASE_URL}/grocery-list/_search`, {
    method: 'POST',
    headers: esHeaders,
    body: JSON.stringify({
      query: { match_all: {} },
      sort: [{ added_date: 'desc' }],
      size: 50,
    }),
  })
  if (!res.ok) throw new Error(`fetchGroceryList failed: ${res.status}`)
  const data = await res.json()
  return data.hits?.hits?.map(h => ({ ...h._source, _id: h._id })) ?? []
}

export async function fetchWasteStats () {
  const res = await fetch(`${ES_BASE_URL}/waste-log/_search`, {
    method: 'POST',
    headers: esHeaders,
    body: JSON.stringify({
      size: 0,
      aggs: {
        total_wasted: { sum: { field: 'purchase_price_sgd' } },
        by_category: {
          terms: { field: 'category' },
          aggs: { total_cost: { sum: { field: 'purchase_price_sgd' } } },
        },
        by_reason: { terms: { field: 'reason' } },
        could_have_saved: {
          filter: { term: { could_have_been_used: true } },
          aggs: { savings: { sum: { field: 'purchase_price_sgd' } } },
        },
      },
    }),
  })
  if (!res.ok) throw new Error(`fetchWasteStats failed: ${res.status}`)
  const data = await res.json()
  return {
    totalWasted: data.aggregations?.total_wasted?.value ?? 0,
    byCategory: data.aggregations?.by_category?.buckets ?? [],
    byReason: data.aggregations?.by_reason?.buckets ?? [],
    preventable: data.aggregations?.could_have_saved?.savings?.value ?? 0,
  }
}

export async function fetchRecipes ({ query = '', cuisine = 'all', mealType = 'all', difficulty = 'all', maxTime = 0 } = {}) {
  const filters = []
  if (cuisine !== 'all') filters.push({ term: { cuisine } })
  if (mealType !== 'all') filters.push({ term: { meal_type: mealType } })
  if (difficulty !== 'all') filters.push({ term: { difficulty } })
  if (maxTime > 0) filters.push({ range: { total_time_minutes: { lte: maxTime } } })

  // description and ingredient_list are semantic_text fields — they don't support
  // standard match queries (confirmed by 400 error logs). Use title and the plain-text
  // ingredient_list_text copy instead.
  const queryClause = query
    ? { multi_match: { query, fields: ['title^3', 'ingredient_list_text'] } }
    : { match_all: {} }

  const body = {
    query: filters.length > 0
      ? { bool: { must: queryClause, filter: filters } }
      : queryClause,
    size: 20,
    _source: ['id', 'title', 'cuisine', 'meal_type', 'difficulty', 'total_time_minutes', 'servings', 'dietary_tags', 'ingredient_list_text'],
  }

  const res = await fetch(`${ES_BASE_URL}/recipes/_search`, {
    method: 'POST',
    headers: esHeaders,
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`fetchRecipes failed: ${res.status}`)
  const data = await res.json()
  return data.hits?.hits?.map(h => h._source) ?? []
}
