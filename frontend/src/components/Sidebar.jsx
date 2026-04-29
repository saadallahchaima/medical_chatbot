import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Stethoscope, Plus, MessageSquare, ChevronLeft, ChevronRight,
  Activity, Database, Settings, Clock, Sparkles, X
} from 'lucide-react'
import { useSession } from '../hooks/useSession'
import { format } from 'date-fns'
import { enUS } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import LanguageSelector from './LanguageSelector'
import MedicalChatbotIcon from './MedicalChatbotIcon'

export default function Sidebar({ open, onToggle, isMobile }) {
  const { sessions, activeSessionId, setActiveSessionId, createSession } = useSession()
  const { t } = useTranslation()

  return (
    <aside
      className="relative flex flex-col h-full transition-all duration-300 ease-out z-20 flex-shrink-0"
      style={{
        width: open ? (isMobile ? '280px' : '280px') : '72px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(236,253,245,0.95) 100%)',
        backdropFilter: 'blur(24px)',
        borderRight: '1px solid rgba(16, 185, 129, 0.12)',
        boxShadow: open ? '4px 0 24px rgba(0,0,0,0.04)' : 'none',
      }}
    >
      <style>{`
        .logo-glow {
          animation: logoGlow 3s ease-in-out infinite;
        }
        @keyframes logoGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.3),
                        0 0 40px rgba(20, 184, 166, 0.2);
          }
          50% {
            box-shadow: 0 0 30px rgba(16, 185, 129, 0.5),
                        0 0 60px rgba(20, 184, 166, 0.3);
          }
        }
        .session-item {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .session-item:hover {
          transform: translateX(3px);
        }
        .nav-icon {
          transition: all 0.3s ease;
        }
        .nav-icon:hover {
          transform: scale(1.12) rotate(3deg);
        }
      `}</style>

      {/* Logo Section */}
      <div className="flex items-center gap-3 px-4 py-4 sm:py-5 border-b border-emerald-100/60">
        <motion.div
          className="flex-shrink-0"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {open ? (
            <MedicalChatbotIcon size="md" animate={true} />
          ) : (
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center logo-glow"
              style={{ background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)' }}
            >
              <Stethoscope size={20} className="text-white heartbeat" strokeWidth={2.5} />
            </div>
          )}
        </motion.div>
        {open && (
          <div className="overflow-hidden flex-1 min-w-0">
            <div className="text-lg font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              MediAgent
            </div>
            <div className="text-[11px] text-slate-400 font-medium tracking-wide truncate">
              {t('app.subtitle') || 'AI Medical Assistant'}
            </div>
          </div>
        )}
        {isMobile && open && (
          <button
            onClick={onToggle}
            className="p-2 rounded-xl hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors touch-target"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Toggle Button — desktop only */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="absolute -right-3 top-6 w-7 h-7 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-md z-30"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)',
            border: '2px solid #d1fae5',
            color: '#10B981',
          }}
        >
          {open ? <ChevronLeft size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
        </button>
      )}

      {/* New Session Button */}
      <div className="p-3">
        <button
          onClick={createSession}
          className="w-full flex items-center gap-3 rounded-2xl transition-all duration-300 hover:scale-[1.02] shadow-emerald hover:shadow-emerald-lg group"
          style={{
            padding: open ? '12px 16px' : '12px',
            justifyContent: open ? 'flex-start' : 'center',
            background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)',
            color: 'white',
          }}
        >
          <Plus size={18} strokeWidth={2.5} className="nav-icon" />
          {open && (
            <span className="text-sm font-semibold flex items-center gap-2">
              {t('nav.newSession') || 'Nouvelle session'}
              <Sparkles size={14} className="opacity-70 group-hover:opacity-100 transition-opacity" />
            </span>
          )}
        </button>
      </div>

      {/* Sessions List */}
      {open && (
        <div className="flex-1 overflow-y-auto px-3 py-2">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 py-2 mb-1">
            {t('nav.recentSessions') || 'Sessions récentes'}
          </div>
          <div className="space-y-1.5">
            {sessions.map((session) => (
              <button
                key={session.id}
                onClick={() => {
                  setActiveSessionId(session.id)
                  if (isMobile) onToggle()
                }}
                className={`session-item w-full text-left rounded-xl px-3 py-3 ${
                  session.id === activeSessionId
                    ? 'bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200 shadow-sm'
                    : 'bg-white/80 border border-slate-100 hover:border-emerald-200 hover:shadow-soft'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <MessageSquare
                    size={14}
                    className={session.id === activeSessionId ? 'text-emerald-500' : 'text-slate-400'}
                    strokeWidth={2}
                  />
                  <span
                    className={`text-sm font-medium truncate ${
                      session.id === activeSessionId ? 'text-emerald-700' : 'text-slate-700'
                    }`}
                  >
                    {session.title}
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-6">
                  <Clock size={10} className="text-slate-400" />
                  <span className="text-[11px] text-slate-500">
                    {format(new Date(session.createdAt), 'HH:mm', { locale: enUS })}
                  </span>
                  {session.messages.length > 0 && (
                    <>
                      <span className="text-[11px] text-slate-300">·</span>
                      <span className="text-[11px] text-slate-500">
                        {Math.floor(session.messages.length / 2)} exchange{session.messages.length > 2 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Collapsed state — session dots */}
      {!open && (
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-2">
          {sessions.slice(0, 6).map((session) => (
            <button
              key={session.id}
              onClick={() => setActiveSessionId(session.id)}
              className={`w-full flex items-center justify-center py-2 rounded-xl transition-all ${
                session.id === activeSessionId
                  ? 'bg-emerald-100 border border-emerald-300'
                  : 'hover:bg-emerald-50/50'
              }`}
              title={session.title}
            >
              <MessageSquare
                size={16}
                className={session.id === activeSessionId ? 'text-emerald-600' : 'text-slate-400'}
                strokeWidth={2}
              />
            </button>
          ))}
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="border-t border-emerald-100/60 p-3 space-y-1">
        {/* Language Selector */}
        {open && (
          <div className="mb-2">
            <LanguageSelector />
          </div>
        )}

        {/* Nav Items */}
        {[
          { icon: Activity, label: t('nav.systemStatus') || 'Statut système', key: 'status', color: 'from-emerald-500 to-emerald-600' },
          { icon: Database, label: t('nav.ragBase') || 'Base RAG', key: 'rag', color: 'from-teal-500 to-teal-600' },
          { icon: Settings, label: t('nav.settings') || 'Paramètres', key: 'settings', color: 'from-slate-500 to-slate-600' }
        ].map(({ icon: Icon, label, key, color }) => (
          <button
            key={key}
            className="w-full flex items-center gap-3 rounded-xl py-2.5 px-3 transition-all hover:bg-gradient-to-r hover:from-emerald-50 hover:to-teal-50 group"
            style={{ justifyContent: open ? 'flex-start' : 'center' }}
          >
            <div className={`nav-icon bg-gradient-to-br ${color} p-1.5 rounded-xl shadow-sm`}>
              <Icon size={16} className="text-white" strokeWidth={2} />
            </div>
            {open && <span className="text-sm text-slate-600 group-hover:text-slate-800 font-medium">{label}</span>}
          </button>
        ))}
      </div>
    </aside>
  )
}

