import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Check } from 'lucide-react'

const LANGUAGES = [
  { code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'en', label: 'English',  flag: '🇬🇧', dir: 'ltr' },
  { code: 'ar', label: 'العربية',  flag: '🇸🇦', dir: 'rtl' },
  { code: 'es', label: 'Español',  flag: '🇪🇸', dir: 'ltr' },
]

export default function LanguageSelector({ compact = false }) {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)

  const current = LANGUAGES.find((l) => l.code === i18n.language)
    || LANGUAGES[0]

  const handleSelect = (code) => {
    i18n.changeLanguage(code)
    setOpen(false)
  }

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all hover:scale-[1.02]"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          color: 'var(--text-secondary)',
          fontSize: '12px',
          fontWeight: 500,
        }}
      >
        <span style={{ fontSize: '14px' }}>{current.flag}</span>
        {!compact && <span>{current.label}</span>}
        <ChevronDown
          size={11}
          style={{
            transition: 'transform 0.2s',
            transform: open ? 'rotate(180deg)' : 'rotate(0)',
          }}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
          />

          <div
            className="absolute z-50 mt-1 rounded-xl overflow-hidden"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-default)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              minWidth: '140px',
              // Position: ouvre vers le haut si trop bas
              bottom: compact ? '110%' : 'auto',
              top: compact ? 'auto' : '110%',
              right: 0,
            }}
          >
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:bg-white/5"
                style={{
                  color: lang.code === i18n.language
                    ? 'var(--accent-teal)'
                    : 'var(--text-primary)',
                  fontSize: '13px',
                  textAlign: 'left',
                  direction: 'ltr',  // Toujours LTR dans le sélecteur
                }}
              >
                <span style={{ fontSize: '16px' }}>{lang.flag}</span>
                <span style={{ flex: 1 }}>{lang.label}</span>
                {lang.code === i18n.language && (
                  <Check size={12} style={{ color: 'var(--accent-teal)' }} />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
