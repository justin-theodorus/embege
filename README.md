# Embege

**Agentic AI Kitchen Co-Pilot — Forge the Future Hackathon, Singapore, March 2026**

Embege helps Singapore households reduce food waste through proactive pantry management, intelligent recipe recommendations, and automated action execution. Its AI agent, **Gibrain**, autonomously monitors the household kitchen on every app open, generates a daily briefing, recommends recipes optimised for expiring ingredients, and executes real actions — adding to grocery lists, logging waste, removing used items from the pantry — all without the user needing to ask.

> Gibrain is not a chatbot. It's a kitchen co-pilot that thinks, decides, and acts.

---

## Table of Contents

- [What Makes This Agentic](#what-makes-this-agentic)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Data Model](#data-model)
- [Elasticsearch Setup](#elasticsearch-setup)
- [Gibrain Agent (Agent Builder)](#gibrain-agent-agent-builder)
- [Frontend](#frontend)
- [Local Development](#local-development)
- [Data Ingestion](#data-ingestion)
- [Project Structure](#project-structure)

---

## What Makes This Agentic

Most food apps are passive trackers. Embege is different across three dimensions:

| Behaviour | Traditional App | Embege |
|---|---|---|
| On open | Static data from a DB query | Gibrain auto-generates the entire dashboard |
| When food expires | Nothing (or a push notification) | Gibrain proactively warns with recipes and dollar amounts at risk |
| After a recommendation | User has to act manually | Gibrain proposes one-click actions that write to Elasticsearch |
| Interaction model | User asks, app responds | Gibrain initiates, chains tools, follows up |

### Three Pillars

**1. Proactive Briefing**
On every dashboard load the frontend sends an auto-briefing prompt to Gibrain. The agent autonomously chains four tools — `expiring_soon → check_pantry → find_recipes → check_groceries` — and returns a structured response that populates the entire page. The user never types anything to trigger this.

**2. Action Execution**
Gibrain returns structured action proposals alongside its text. The frontend parses these and renders them as clickable buttons. One click executes a direct Elasticsearch write. Four action types are supported: add to grocery list, remove from pantry, log waste, and mark grocery item as bought.

**3. Autonomous Chaining**
A single expiring item at $9.90 triggers a full chain: check expiring items → inspect full pantry → find recipes that use those items with existing ingredients → check grocery list for missing ingredients → propose adding them. Minimum four tool calls per cooking recommendation.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Search & Storage | Elasticsearch Serverless (AWS `ap-southeast-1`) |
| Embeddings | OpenAI `text-embedding-3-small` via ES Inference API |
| Agent LLM | AWS Bedrock Claude Sonnet via Kibana Connector |
| Agent Framework | Elastic Agent Builder with 6 custom ES\|QL tools |
| Frontend | React 19 + Tailwind CSS + Vite |
| Agent Integration | Agent Builder `/api/agent_builder/converse` REST endpoint |
| Data Processing | Python (`elasticsearch-py`, `python-dotenv`) |

### Why Bedrock Claude over the Elastic Managed LLM

Autonomous multi-tool chaining is the core product behaviour. The managed LLM reliably stops after one or two tool calls. Claude Sonnet completes the full four-plus call chain, interprets intermediate results, and produces consistently structured action proposals that the frontend can parse into buttons.

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│               FRONTEND  (React + Tailwind, Vite)             │
│                                                              │
│  On dashboard load:                                          │
│    → auto-send briefing prompt via /converse                 │
│    → Gibrain response populates dashboard cards              │
│                                                              │
│  On action button click:                                     │
│    → direct PUT / POST / DELETE to Elasticsearch             │
│    → add to grocery, remove from pantry, log waste           │
│                                                              │
│  Pages: Dashboard · Inventory · Recipes · Groceries · Chat   │
│  Persistent: collapsible Gibrain panel (right side)          │
└──────────────────────────┬───────────────────────────────────┘
                           │
               ┌───────────┴────────────┐
               │  /kb-proxy (dev)       │  /es-proxy (dev)
               ▼                        ▼
   Kibana / Agent Builder API    Elasticsearch API
   POST /api/agent_builder/      pantry-items · recipes
   converse                      waste-log · grocery-list
               │
               ▼
   ┌──────────────────────────┐
   │  Gibrain Agent           │
   │  LLM: Bedrock Claude     │
   │  6 ES|QL read tools      │
   └──────────────────────────┘
```

**Read / write separation:** the agent only reads data through ES|QL tools. All writes happen from the frontend, triggered by the user confirming an action. This keeps the agent safe while remaining agentic.

---

## Data Model

Four Elasticsearch indices power the application.

### `pantry-items`
40 household inventory items representing a realistic Singapore household pantry.

| Field | Type | Notes |
|---|---|---|
| `id` | keyword | |
| `name` | text + keyword | |
| `category` | keyword | protein, vegetables, dairy, carbs, fruits, condiments, pantry_staple |
| `quantity` / `unit` | float / keyword | |
| `purchase_date` / `expiry_date` | date | |
| `days_until_expiry` | integer | Pre-computed; used by `expiring_soon` tool |
| `status` | keyword | fresh, expiring_soon, expired |
| `storage` | keyword | fridge, freezer, pantry |
| `price_sgd` | float | |

### `recipes`
~5,000 recipes from an open-source dataset. The `description` and `ingredient_list` fields use `semantic_text` with OpenAI embeddings, enabling meaning-based search ("something warm and soupy" returns laksa, not keyword hits).

| Field | Type | Notes |
|---|---|---|
| `id` | keyword | |
| `title` | text | |
| `description` | semantic_text | Embedded via `openai-embeddings` inference endpoint |
| `ingredient_list` | semantic_text | Embedded |
| `ingredient_list_text` | text | Plain-text copy for standard keyword search fallback |
| `cuisine` | keyword | Singaporean, Chinese, Indian, Italian, Japanese, Korean, Thai, Western |
| `meal_type` | keyword | breakfast, lunch, dinner, snack, dessert |
| `difficulty` | keyword | easy, medium, hard |
| `total_time_minutes` | integer | |
| `dietary_tags` | keyword | |

### `waste-log`
40 historical waste entries spanning February–March 2026. Used for analytics (waste by category, waste reason distribution, preventable waste percentage).

| Field | Type | Notes |
|---|---|---|
| `item_name` | text + keyword | |
| `category` | keyword | |
| `quantity_wasted` / `unit` | float / keyword | |
| `reason` | keyword | expired, forgotten, wilted, mouldy, overripe, slimy |
| `purchase_price_sgd` | float | |
| `wasted_date` | date | |
| `could_have_been_used` | boolean | Drives preventable waste metric |
| `week_number` | integer | |

### `grocery-list`
Shared household shopping list with member attribution. The agent can add items; household members can mark items as bought.

| Field | Type | Notes |
|---|---|---|
| `item_name` | text + keyword | |
| `category` | keyword | |
| `status` | keyword | pending, bought, low_stock |
| `priority` | keyword | high, medium, low |
| `added_by` | keyword | "Gibrain", "Bach Lil", etc. |
| `bought_by` | keyword | Who bought it — household-aware |
| `added_date` | date | |
| `notes` | text | |

---

## Gibrain Agent (Agent Builder)

### Agent configuration

```
Agent ID:    gibrain-kitchen-assistant
LLM:         Amazon Bedrock (Claude Sonnet) connector
Tools:       6 custom ES|QL tools (see below)
```

### 6 ES|QL tools

| Tool name | Description |
|---|---|
| `embege.check_pantry` | Returns pantry/fridge/freezer contents, filtered by category and storage |
| `embege.expiring_soon` | Finds items expiring within N days, sorted by urgency |
| `embege.find_recipes` | Searches recipes filtered by cuisine, meal type, difficulty, max cook time |
| `embege.check_groceries` | Returns the household grocery list filtered by status |
| `embege.suggest_shopping` | Finds pantry items running low below a threshold quantity |
| `embege.waste_stats` | Aggregates waste history: total SGD wasted, breakdown by category and reason |

All tools are read-only ES|QL queries. No built-in Elastic tools are enabled on the agent.

### System prompt highlights

Gibrain is instructed to:

- **Auto-brief** on load: chain `expiring_soon → check_pantry → find_recipes → check_groceries` and return a structured kitchen briefing without waiting to be asked
- **Propose actions** after every recommendation using structured prefixes: `➕` (add to grocery), `✅` (mark as used), `🗑️` (log waste), `📝` (mark bought)
- **Chain autonomously**: never stop at one tool call — minimum four for any cooking recommendation
- **Follow up** after user decisions: remove used items, celebrate savings, suggest the next recipe
- **Use household context**: references Bach Lil, Dad, and Wowo's Household by name; Singapore cuisine and hawker-style dishes

---

## Frontend

### Pages

| Route | Component | Description |
|---|---|---|
| `/` | `DashboardPage` | Agent-generated briefing on every load: expiring cards, Cook Tonight, grocery summary, waste progress |
| `/inventory` | `InventoryPage` | Full pantry with category + storage filters; add item modal with real-time ES indexing |
| `/recipes` | `RecipesPage` | Browse and search ~5,000 recipes; filter by cuisine, meal type, difficulty, cook time |
| `/groceries` | `GroceriesPage` | Shared household grocery list with member attribution, priority badges, mark-as-bought |
| `/chat` | `ChatPage` | Full-page Gibrain conversation view with action button rendering |

**Persistent layout:** a collapsible `GibrainPanel` sits on the right side of every page, pre-loaded with the day's briefing, always ready for follow-up conversation.

### Key hooks

**`useConversation`** — manages a single Agent Builder conversation across the entire app session. The first `sendMessage` call omits `conversation_id`; the API auto-creates one and returns it; all subsequent calls reuse it for context continuity.

**`useBriefing`** — fires `requestBriefing` on dashboard mount with a 5-minute module-level cache. Navigating away and back to the dashboard reuses the cached briefing instantly without hitting the agent again. Also seeds the chat panel with the briefing so the Gibrain panel feels pre-loaded.

### API client (`src/api/elastic.js`)

Two sets of functions:

**Agent Builder (via Kibana endpoint):**
- `sendMessage(conversationId, message)` — POST to `/api/agent_builder/converse`
- `requestBriefing()` — sends the auto-briefing prompt; used by `useBriefing`

**Direct Elasticsearch writes (action execution):**
- `addToGroceryList(item)` — PUT to `grocery-list/_doc/{id}`, `added_by: "Gibrain"`
- `removeFromPantry(itemId)` — DELETE from `pantry-items/_doc/{id}`
- `logWaste(item)` — PUT to `waste-log/_doc/{id}`
- `markGroceryBought(itemId, boughtBy)` — POST to `grocery-list/_update/{id}`
- `addPantryItem(item)` — PUT to `pantry-items/_doc/{id}`

**Direct Elasticsearch reads (non-agent pages / fallback):**
- `fetchAllPantryItems()`, `fetchExpiringItems(maxDays)`
- `fetchGroceryList()`, `fetchWasteStats()`, `fetchRecipes(filters)`

### Dev proxy

Vite proxies two paths in development to avoid CORS issues:

- `/kb-proxy/*` → Kibana URL (Agent Builder lives here)
- `/es-proxy/*` → Elasticsearch URL (direct data API)

In production builds, requests go directly to the respective cloud endpoints.

---

## Local Development

### Prerequisites

- Node.js 18+
- An Elasticsearch Serverless project with all four indices populated
- A working Gibrain agent in Agent Builder

### Setup

```bash
cd app
npm install
```

Create `app/.env`:

```env
VITE_ELASTIC_URL=https://<your-project>.es.ap-southeast-1.aws.elastic.cloud:443
VITE_KIBANA_URL=https://<your-project>.kb.ap-southeast-1.aws.elastic.cloud
VITE_ELASTIC_API_KEY=<your-api-key>
VITE_AGENT_ID=gibrain-kitchen-assistant
```

Start the dev server:

```bash
npm run dev
# → http://localhost:5173
```

---

## Project Structure

```
shelfsense/
├── app/                          # React frontend
│   ├── src/
│   │   ├── api/
│   │   │   └── elastic.js        # All ES + Agent Builder API calls
│   │   ├── components/
│   │   │   ├── chat/             # GibrainChat, ChatPage, ActionButton
│   │   │   ├── dashboard/        # DashboardPage, ExpiringCards, CookTonight, GrocerySummary, ProgressWidget, WasteWidget
│   │   │   ├── groceries/        # GroceriesPage
│   │   │   ├── inventory/        # InventoryPage, AddItemModal
│   │   │   ├── layout/           # Sidebar, GibrainPanel
│   │   │   ├── recipes/          # RecipesPage
│   │   │   └── shared/           # GibrainQuickChat
│   │   ├── hooks/
│   │   │   ├── useBriefing.js    # Auto-briefing with 5-min cache
│   │   │   ├── useConversation.js # Agent Builder conversation state
│   │   │   ├── useGroceryData.js
│   │   │   └── usePantryData.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js            # Dev proxy config (kb-proxy, es-proxy)
│   └── package.json
├── data/
│   ├── sample-pantry.json        # 40 pantry items (Singapore household)
│   ├── recipes.json              # ~5,000 processed recipes
│   ├── waste-log.json            # 40 historical waste entries
│   └── grocery-list.json         # Shared household grocery list
├── dataset/
│   └── full_dataset.csv          # Raw recipe dataset
├── convert_recipes.py            # CSV → JSON recipe transformer
├── ingest_recipes.py             # Bulk ingest recipes into ES
```
