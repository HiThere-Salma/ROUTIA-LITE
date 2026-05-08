import type { KeyboardEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

type Suggestion = {
  id: string
  label: string
}

type AddressAutocompleteInputProps = {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  disabled?: boolean
}

type MapboxFeature = {
  id: string
  place_name?: string
}

type MapboxResponse = {
  features?: MapboxFeature[]
}

const MAPBOX_ACCESS_TOKEN =
  (import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined) ||
  (import.meta.env.VITE_MAPBOX_KEY as string | undefined)

export default function AddressAutocompleteInput({
  id,
  value,
  onChange,
  placeholder,
  required,
  disabled,
}: AddressAutocompleteInputProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  const { t } = useTranslation()
  const canAutocomplete = useMemo(() => Boolean(MAPBOX_ACCESS_TOKEN), [])

  useEffect(() => {
    const query = value.trim()

    if (!canAutocomplete || query.length < 3) {
      setSuggestions([])
      setIsLoading(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true)

      try {
        const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?autocomplete=true&limit=5&language=fr&country=ma&access_token=${MAPBOX_ACCESS_TOKEN}`
        const response = await fetch(endpoint, { signal: controller.signal })

        if (!response.ok) {
          setSuggestions([])
          return
        }

        const payload = (await response.json()) as MapboxResponse
        const nextSuggestions = (payload.features ?? [])
          .filter((feature) => typeof feature.place_name === 'string' && feature.place_name.length > 0)
          .map((feature) => ({ id: feature.id, label: feature.place_name as string }))

        setSuggestions(nextSuggestions)
        setIsOpen(true)
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setSuggestions([])
        }
      } finally {
        setIsLoading(false)
      }
    }, 280)

    return () => {
      controller.abort()
      window.clearTimeout(timeoutId)
    }
  }, [value, canAutocomplete])

  function selectSuggestion(label: string) {
    onChange(label)
    setSuggestions([])
    setIsOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || suggestions.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (current + 1) % suggestions.length)
      return
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1))
      return
    }

    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault()
      selectSuggestion(suggestions[activeIndex].label)
      return
    }

    if (event.key === 'Escape') {
      setIsOpen(false)
      setActiveIndex(-1)
    }
  }

  return (
    <div className="address-autocomplete">
      <input
        id={id}
        type="text"
        value={value}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        autoComplete="off"
        onChange={(event) => {
          onChange(event.target.value)
          setIsOpen(true)
          setActiveIndex(-1)
        }}
        onFocus={() => {
          if (suggestions.length > 0) {
            setIsOpen(true)
          }
        }}
        onBlur={() => {
          window.setTimeout(() => setIsOpen(false), 120)
        }}
        onKeyDown={handleKeyDown}
      />

      {canAutocomplete && isOpen && (isLoading || suggestions.length > 0) && (
        <div className="address-autocomplete-menu">
          {isLoading && <div className="address-autocomplete-state">{t('addressInput.searching')}</div>}
          {!isLoading && suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              type="button"
              className={`address-autocomplete-item ${activeIndex === index ? 'address-autocomplete-item--active' : ''}`}
              onMouseDown={() => selectSuggestion(suggestion.label)}
            >
              {suggestion.label}
            </button>
          ))}
        </div>
      )}

      {!canAutocomplete && (
        <span className="address-autocomplete-state">{t('addressInput.mapboxUnavailable')}</span>
      )}
    </div>
  )
}
