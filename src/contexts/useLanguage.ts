import { useContext } from 'react'
import { LanguageContext } from './language.ts'

export function useLanguage() {
  return useContext(LanguageContext)
}
