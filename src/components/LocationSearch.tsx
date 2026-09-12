import { Crosshair, LoaderCircle, MapPin, Search, X } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'
import { searchLocations } from '../lib/weather'
import type { WeatherLocation } from '../types/weather'

type LocationSearchProps = {
  onSelect: (location: WeatherLocation) => void
  onUseLocation: () => void
  locating: boolean
}

function locationSubtitle(location: WeatherLocation) {
  return [location.admin1, location.country].filter(Boolean).join(', ')
}

function LocationSearch({ onSelect, onUseLocation, locating }: LocationSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<WeatherLocation[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const trimmedQuery = query.trim()

    if (trimmedQuery.length < 2) {
      setResults([])
      setSearching(false)
      setSearchError(null)
      return
    }

    const controller = new AbortController()
    const timeout = window.setTimeout(async () => {
      setSearching(true)
      setSearchError(null)

      try {
        const locations = await searchLocations(trimmedQuery, controller.signal)
        setResults(locations)
        setOpen(true)
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        setSearchError(error instanceof Error ? error.message : 'Location search failed.')
        setResults([])
        setOpen(true)
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false)
        }
      }
    }, 250)

    return () => {
      controller.abort()
      window.clearTimeout(timeout)
    }
  }, [query])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  const chooseLocation = (location: WeatherLocation) => {
    onSelect(location)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (results[0]) {
      chooseLocation(results[0])
    }
  }

  return (
    <div className="location-search" ref={containerRef}>
      <form className="search-box" onSubmit={handleSubmit}>
        <Search className="search-box__icon" size={19} strokeWidth={1.8} />
        <input
          aria-label="Search city or place"
          autoComplete="off"
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => query.trim().length >= 2 && setOpen(true)}
          placeholder="Search city or place"
          spellCheck={false}
          type="search"
          value={query}
        />
        {searching ? (
          <LoaderCircle className="search-box__loader" size={18} />
        ) : query ? (
          <button
            aria-label="Clear search"
            className="search-box__clear"
            onClick={() => {
              setQuery('')
              setResults([])
              setOpen(false)
            }}
            type="button"
          >
            <X size={17} />
          </button>
        ) : null}
      </form>

      <button className="location-button" disabled={locating} onClick={onUseLocation} type="button">
        {locating ? <LoaderCircle className="spin" size={18} /> : <Crosshair size={18} />}
        <span>{locating ? 'Locating…' : 'Use my location'}</span>
      </button>

      {open ? (
        <div className="search-results" role="listbox" aria-label="Location suggestions">
          {searchError ? <p className="search-message">{searchError}</p> : null}
          {!searchError && !searching && results.length === 0 ? (
            <p className="search-message">No matching places found.</p>
          ) : null}
          {results.map((location) => (
            <button
              className="search-result"
              key={`${location.id ?? location.name}-${location.latitude}-${location.longitude}`}
              onClick={() => chooseLocation(location)}
              role="option"
              type="button"
            >
              <span className="search-result__icon">
                <MapPin size={17} />
              </span>
              <span className="search-result__copy">
                <strong>{location.name}</strong>
                <small>{locationSubtitle(location)}</small>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export default LocationSearch
