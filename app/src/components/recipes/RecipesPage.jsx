import { useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { fetchRecipes } from '../../api/elastic'
import { useBriefing } from '../../hooks/useBriefing'
import { GibrainQuickChat } from '../shared/GibrainQuickChat'

const CUISINES = ['all', 'Singaporean', 'Chinese', 'Indian', 'Italian', 'Japanese', 'Korean', 'Thai', 'Western']
const MEAL_TYPES = ['all', 'breakfast', 'lunch', 'dinner', 'snack', 'dessert']
const DIFFICULTIES = ['all', 'easy', 'medium', 'hard']
const MAX_TIMES = [
  { label: 'Any time', value: 0 },
  { label: '≤ 15 min', value: 15 },
  { label: '≤ 30 min', value: 30 },
  { label: '≤ 45 min', value: 45 },
  { label: '≤ 60 min', value: 60 },
]

const CUISINE_FLAGS = {
  Singaporean: '🇸🇬', Chinese: '🥢', Indian: '🌶️', Italian: '🍝',
  Japanese: '🍱', Korean: '🥘', Thai: '🌿', Western: '🍔',
}

const DIFFICULTY_STYLE = {
  easy: 'text-brand-green bg-brand-greenMuted border-brand-green/30',
  medium: 'text-amber-600 bg-amber-50 border-amber-200',
  hard: 'text-red-500 bg-red-50 border-red-200',
}

const FOOD_IMAGES = ['/food.jpg', '/food3.jpg']

function RecipeCard ({ recipe, index }) {
  const imageUrl = FOOD_IMAGES[index % 2]
  const difficultyStyle = DIFFICULTY_STYLE[recipe.difficulty] || DIFFICULTY_STYLE.easy

  return (
    <div className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden hover:border-brand-green hover:shadow-md transition-all group cursor-pointer">
      {/* Image */}
      <div className="w-full h-36 overflow-hidden relative">
        <img
          src={imageUrl}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {recipe.cuisine && recipe.cuisine !== 'Unknown' && (
          <div className="absolute top-2 left-2">
            <span className="text-lg">{CUISINE_FLAGS[recipe.cuisine] || '🍽️'}</span>
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-2">
        <h3 className="text-brand-cream font-semibold text-sm leading-tight line-clamp-2 group-hover:text-brand-green transition-colors">
          {recipe.title}
        </h3>

        <div className="flex flex-wrap gap-1.5">
          {recipe.cuisine && recipe.cuisine !== 'Unknown' && (
            <span className="text-xs text-brand-muted bg-brand-bg px-2 py-0.5 rounded-full">{recipe.cuisine}</span>
          )}
          {recipe.meal_type && (
            <span className="text-xs text-brand-muted bg-brand-bg px-2 py-0.5 rounded-full capitalize">{recipe.meal_type}</span>
          )}
          {recipe.difficulty && (
            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize font-medium ${difficultyStyle}`}>
              {recipe.difficulty}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-brand-muted text-xs">
          {recipe.total_time_minutes > 0 && (
            <span className="flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M6 3.5V6l2 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {recipe.total_time_minutes} min
            </span>
          )}
          {recipe.servings > 0 && (
            <span className="flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="4" r="2" stroke="currentColor" strokeWidth="1.2" />
                <path d="M2 10c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              </svg>
              {recipe.servings} servings
            </span>
          )}
        </div>

        {recipe.ingredient_list_text && (
          <p className="text-brand-muted text-xs line-clamp-2 leading-relaxed">
            {recipe.ingredient_list_text}
          </p>
        )}
      </div>
    </div>
  )
}

export function RecipesPage ({ conversationData }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [cuisine, setCuisine] = useState('all')
  const [mealType, setMealType] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [maxTime, setMaxTime] = useState(0)
  const [recipes, setRecipes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)
  const debounceRef = useRef(null)

  const { briefingText, briefingLoading } = useBriefing({ addAssistantMessage: null })

  const runSearch = useCallback(async (query, filters) => {
    setIsLoading(true)
    setError(null)
    setSearched(true)
    try {
      const results = await fetchRecipes({ query, ...filters })
      setRecipes(results)
    } catch (err) {
      console.error('Recipe search error:', err)
      setError('Failed to search recipes. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    runSearch(searchQuery, { cuisine, mealType, difficulty, maxTime })
  }

  const handleQueryChange = (val) => {
    setSearchQuery(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      runSearch(val, { cuisine, mealType, difficulty, maxTime })
    }, 600)
  }

  const handleFilterChange = (key, val) => {
    const newFilters = { cuisine, mealType, difficulty, maxTime, [key]: val }
    if (key === 'cuisine') setCuisine(val)
    if (key === 'mealType') setMealType(val)
    if (key === 'difficulty') setDifficulty(val)
    if (key === 'maxTime') setMaxTime(val)
    runSearch(searchQuery, newFilters)
  }

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-brand-muted mb-4">
        <Link to="/" className="hover:text-brand-cream transition-colors">Dashboard</Link>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="text-brand-cream font-medium">Recipes</span>
      </div>

      {/* Gibrain Quick Chat */}
      <div className="mb-6">
        <GibrainQuickChat
          briefingText={briefingText}
          isLoading={briefingLoading}
          conversationData={conversationData}
        />
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-5">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder='Try "something warm and soupy" or "use up spinach and eggs"'
              value={searchQuery}
              onChange={e => handleQueryChange(e.target.value)}
              className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-sm text-brand-cream placeholder-brand-muted focus:outline-none focus:border-brand-green shadow-sm pr-10"
            />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M10.5 10.5L13.5 13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <button
            type="submit"
            className="px-5 py-3 bg-brand-green hover:bg-brand-olive text-white rounded-xl text-sm font-medium transition-colors flex-shrink-0 shadow-sm"
          >
            Search
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6">
        {/* Cuisine */}
        <div className="flex flex-wrap gap-2">
          {CUISINES.map(c => (
            <button
              key={c}
              onClick={() => handleFilterChange('cuisine', c)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                cuisine === c
                  ? 'bg-brand-greenMuted text-brand-greenDark border-brand-green/40 font-medium'
                  : 'bg-brand-card text-brand-muted border-brand-border hover:text-brand-cream hover:border-brand-subtle'
              }`}
            >
              {c === 'all' ? 'All Cuisines' : `${CUISINE_FLAGS[c] || ''} ${c}`}
            </button>
          ))}
        </div>

        {/* Meal type + difficulty + time */}
        <div className="flex flex-wrap gap-2">
          {MEAL_TYPES.map(m => (
            <button
              key={m}
              onClick={() => handleFilterChange('mealType', m)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                mealType === m
                  ? 'bg-brand-greenMuted text-brand-greenDark border-brand-green/40 font-medium'
                  : 'bg-brand-card text-brand-muted border-brand-border hover:text-brand-cream'
              }`}
            >
              {m === 'all' ? 'All Meals' : m}
            </button>
          ))}
          <div className="w-px bg-brand-border mx-0.5" />
          {DIFFICULTIES.map(d => (
            <button
              key={d}
              onClick={() => handleFilterChange('difficulty', d)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors capitalize ${
                difficulty === d
                  ? 'bg-brand-greenMuted text-brand-greenDark border-brand-green/40 font-medium'
                  : 'bg-brand-card text-brand-muted border-brand-border hover:text-brand-cream'
              }`}
            >
              {d === 'all' ? 'Any Difficulty' : d}
            </button>
          ))}
          <div className="w-px bg-brand-border mx-0.5" />
          {MAX_TIMES.map(t => (
            <button
              key={t.value}
              onClick={() => handleFilterChange('maxTime', t.value)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                maxTime === t.value
                  ? 'bg-brand-greenMuted text-brand-greenDark border-brand-green/40 font-medium'
                  : 'bg-brand-card text-brand-muted border-brand-border hover:text-brand-cream'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
            <div key={i} className="bg-brand-card border border-brand-border rounded-2xl overflow-hidden animate-pulse shadow-sm">
              <div className="h-36 bg-brand-bg" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-brand-bg rounded-full w-3/4" />
                <div className="h-3 bg-brand-bg rounded-full w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : !searched ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl overflow-hidden">
            <img src="/food.jpg" alt="recipes" className="w-full h-full object-cover" />
          </div>
          <p className="text-brand-cream font-semibold text-base mb-2">Discover 5,000+ recipes</p>
          <p className="text-brand-muted text-sm">
            Search by ingredient, dish name, or describe what you feel like eating.<br />
            AI semantic search understands natural language.
          </p>
          <button
            onClick={() => runSearch('', {})}
            className="mt-6 px-5 py-2.5 bg-brand-green hover:bg-brand-olive text-white rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            Browse All Recipes
          </button>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 text-brand-muted text-sm">
          No recipes found. Try a different search or remove some filters.
        </div>
      ) : (
        <>
          <p className="text-brand-muted text-xs mb-4">{recipes.length} recipes found</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recipes.map((recipe, i) => (
              <RecipeCard key={recipe.id ?? i} recipe={recipe} index={i} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
