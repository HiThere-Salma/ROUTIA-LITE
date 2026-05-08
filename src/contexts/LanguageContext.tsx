import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { LanguageContext } from './language.ts'
import type { Language } from './language.ts'
import i18n from '../i18n'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    return (localStorage.getItem('lang') as Language) ?? 'fr'
  })

  function setLang(newLang: Language) {
    setLangState(newLang)
    localStorage.setItem('lang', newLang)
    void i18n.changeLanguage(newLang)
  }

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}
