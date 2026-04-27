import { createContext } from 'react'

export type Language = 'fr' | 'en' | 'ar'

export interface LanguageContextValue {
  lang: Language
  setLang: (lang: Language) => void
}

export const LanguageContext = createContext<LanguageContextValue>({
  lang: 'fr',
  setLang: () => {},
})
