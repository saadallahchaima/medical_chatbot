import i18n from 'i18next'  
import { initReactI18next } from 'react-i18next'  
import LanguageDetector from 'i18next-browser-languagedetector'  

import fr from './fr.json'  
import en from './en.json'  
import ar from './ar.json'  
import es from './es.json'  

i18n  
  .use(LanguageDetector)        // Detects browser language  
  .use(initReactI18next)  
  .init({  
    resources: {  
      fr: { translation: fr },  
      en: { translation: en },  
      ar: { translation: ar },  
      es: { translation: es },  
    },  
    fallbackLng: 'en',          // English by default  
    supportedLngs: ['fr', 'en', 'ar', 'es'],  
    interpolation: { escapeValue: false },  
    detection: {  
      order: ['localStorage', 'navigator'],  
      caches: ['localStorage'],  
    },  
  })  

// Apply RTL direction automatically for Arabic  
i18n.on('languageChanged', (lng) => {  
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr'  
  document.documentElement.lang = lng  
})  

export default i18n
