/**
 * AI natural-language search bar (the assignment's headline feature).
 *
 * Sits above the results as a distinct, highlighted bar so it's obvious this
 * is the "smart" search. The customer types a sentence and we send it to the
 * backend's /search endpoint, which interprets it (Groq or rule-based) and
 * returns ranked buses.
 */
import { useState } from 'react'

const EXAMPLES = [
  'AC bus from Mumbai to Pune tomorrow morning',
  'cheap non-AC bus to Pune under 500',
  'sleeper from Hyderabad to Bangalore tonight',
]

export default function AiSearchBar({ loading, onSearch }) {
  const [query, setQuery] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (query.trim()) onSearch(query.trim())
  }

  return (
    <div className="ai-search">
      <form className="ai-search-bar" onSubmit={submit}>
        <span className="ai-spark">✨</span>
        <input
          className="ai-search-input"
          placeholder="Ask AI: I need a bus from Mumbai to Pune tomorrow morning, preferably AC"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button className="btn btn-primary" disabled={loading}>
          {loading ? 'Thinking…' : 'AI Search'}
        </button>
      </form>
      <div className="ai-examples">
        {EXAMPLES.map((ex) => (
          <button key={ex} type="button" className="chip" onClick={() => { setQuery(ex); onSearch(ex) }}>
            {ex}
          </button>
        ))}
      </div>
    </div>
  )
}
