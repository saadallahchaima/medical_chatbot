import { User, Stethoscope, Activity, Heart, Brain, Loader2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import MedicalChatbotIcon from './MedicalChatbotIcon'

export function UserMessage({ content, files }) {
  const imageFiles = files?.filter((f) => f.type === 'image' || f.url)

  return (
    <motion.div
      className="flex justify-end mb-3 sm:mb-4"
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="flex items-start gap-2 sm:gap-3 max-w-[92%] sm:max-w-[85%] md:max-w-[75%]">
        <div className="message-bubble-user px-3.5 sm:px-5 py-2.5 sm:py-3.5 rounded-2xl rounded-tr-md">
          {/* Display attached images */}
          {imageFiles && imageFiles.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              {imageFiles.map((f, i) => (
                <div key={i} className="rounded-xl overflow-hidden border border-emerald-100 bg-slate-50">
                  <img
                    src={f.url}
                    alt={f.filename || 'Medical image'}
                    className="max-h-40 sm:max-h-48 w-full object-contain"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
          <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">{content}</p>
        </div>
        <motion.div
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
          style={{ background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)' }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <User size={14} className="text-white sm:hidden" strokeWidth={2.5} />
          <User size={16} className="text-white hidden sm:block" strokeWidth={2.5} />
        </motion.div>
      </div>
    </motion.div>
  )
}

function MedicalThinkingAnimation() {
  return (
    <div className="flex items-center gap-4">
      <style>{`
        .ecg-line {
          animation: ecg 2s ease-in-out infinite;
        }
        @keyframes ecg {
          0%, 100% { d: path('M 0 20 L 20 20 L 25 10 L 30 30 L 35 15 L 40 20 L 60 20'); }
          50% { d: path('M 0 20 L 20 20 L 25 5 L 30 35 L 35 10 L 40 20 L 60 20'); }
        }
        .pulse-dot {
          animation: pulseDot 1.5s ease-in-out infinite;
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
        }
        .thinking-text {
          animation: thinkingFade 2s ease-in-out infinite;
        }
        @keyframes thinkingFade {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      `}</style>

      {/* ECG-like Animation */}
      <svg width="60" height="40" viewBox="0 0 60 40" className="ecg-animation">
        <path
          className="ecg-line"
          d="M 0 20 L 20 20 L 25 10 L 30 30 L 35 15 L 40 20 L 60 20"
          fill="none"
          stroke="url(#ecg-gradient-green)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <defs>
          <linearGradient id="ecg-gradient-green" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Thinking Text */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent thinking-text">
          Analysis in progress
        </span>
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full pulse-dot"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)',
                animationDelay: `${i * 0.2}s`
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function AssistantMessage({ report, isLoading }) {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(true)

  useEffect(() => {
    if (!report?.full_response && !isLoading) return

    const text = report?.full_response || ''
    let index = 0
    setDisplayedText('')
    setIsTyping(true)

    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        setIsTyping(false)
        clearInterval(interval)
      }
    }, 12)

    return () => clearInterval(interval)
  }, [report?.full_response])

  if (isLoading) {
    return (
      <motion.div
        className="flex justify-start mb-3 sm:mb-4"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="flex items-start gap-2 sm:gap-3 max-w-[92%] sm:max-w-[90%] md:max-w-[85%]">
          <div className="flex-shrink-0 mt-1">
            <MedicalChatbotIcon size="sm" animate={true} />
          </div>
          <div className="bg-emerald-50/80 backdrop-blur-sm px-4 sm:px-6 py-4 sm:py-5 rounded-2xl rounded-tl-md shadow-card border border-emerald-100/80 flex-1 min-w-0">
            <MedicalThinkingAnimation />
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      className="flex justify-start mb-3 sm:mb-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="flex items-start gap-2 sm:gap-3 max-w-[92%] sm:max-w-[90%] md:max-w-[85%]">
        <div className="flex-shrink-0 mt-1">
          <MedicalChatbotIcon size="sm" animate={false} />
        </div>
        <div className="message-bubble-assistant px-3.5 sm:px-5 py-3 sm:py-4 rounded-2xl rounded-tl-md min-w-0 flex-1">
          {/* Summary/Title */}
          {report?.summary && (
            <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b border-emerald-100/60">
              <div className="flex items-center gap-2 mb-2">
                <Activity size={14} className="text-emerald-500 sm:hidden" />
                <Activity size={16} className="text-emerald-500 hidden sm:block" />
                <h4 className="text-sm font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
                  Summary
                </h4>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm">{report.summary}</p>
            </div>
          )}

          {/* Main Response */}
          {report?.full_response && (
            <div className="space-y-2 sm:space-y-3">
              <div className="prose prose-sm max-w-none">
                <p className="text-slate-700 leading-relaxed whitespace-pre-wrap text-sm">
                  {displayedText}
                  {isTyping && (
                    <span className="inline-block w-0.5 h-4 ml-1 bg-gradient-to-r from-emerald-500 to-teal-500 animate-pulse" />
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {report?.recommendations && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-emerald-100/60">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Heart size={14} className="text-rose-400 heartbeat sm:hidden" />
                <Heart size={16} className="text-rose-400 heartbeat hidden sm:block" />
                <h4 className="text-sm font-bold bg-gradient-to-r from-rose-500 to-orange-500 bg-clip-text text-transparent">
                  Recommendations
                </h4>
              </div>
              <div className="bg-rose-50/60 p-3 sm:p-4 rounded-xl border border-rose-100/60 space-y-2">
                <p className="text-slate-600 leading-relaxed text-sm">{report.recommendations}</p>
              </div>
            </div>
          )}

          {/* Sources */}
          {report?.sources && report.sources.length > 0 && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-emerald-100/60">
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Brain size={14} className="text-violet-500 sm:hidden" />
                <Brain size={16} className="text-violet-500 hidden sm:block" />
                <h4 className="text-sm font-semibold text-slate-600">Medical Sources</h4>
              </div>
              <div className="space-y-2">
                {report.sources.map((source, i) => (
                  <div key={i} className="bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100 hover:border-emerald-200 transition-colors">
                    <p className="text-xs text-slate-500 leading-relaxed">{source}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence */}
          {report?.confidence && (
            <div className="mt-3 sm:mt-4 flex items-center gap-3">
              <div className="flex-1 h-2 bg-emerald-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: 'linear-gradient(90deg, #10B981 0%, #14B8A6 100%)'
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: `${report.confidence}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <span className="text-xs font-medium text-slate-400 flex-shrink-0">
                {report.confidence}% confidence
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

