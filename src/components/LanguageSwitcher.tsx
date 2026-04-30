import { useState, useRef, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { useLanguage } from '../contexts/useLanguage.ts'
import type { Language } from '../contexts/language.ts'

const LANGUAGES: { code: Language; label: string; nativeLabel: string }[] = [
  { code: 'fr', label: 'Français', nativeLabel: 'FR' },
  { code: 'en', label: 'English',  nativeLabel: 'EN' },
  { code: 'ar', label: 'العربية',  nativeLabel: 'AR' },
]

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const current = LANGUAGES.find(l => l.code === lang)!

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        className="icon-btn lang-switcher-btn"
        onClick={() => setOpen(o => !o)}
        title="Changer de langue"
        style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '12px', fontWeight: 600 }}
      >
        <Globe size={14} />
        <span>{current.nativeLabel}</span>
      </button>

      {open && (
        <div className="lang-dropdown">
          {LANGUAGES.map(l => (
            <button
              key={l.code}
              className={`lang-option${l.code === lang ? ' lang-option--active' : ''}`}
              onClick={() => { setLang(l.code); setOpen(false) }}
            >
              <span className="lang-code">{l.nativeLabel}</span>
              <span className="lang-label">{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
