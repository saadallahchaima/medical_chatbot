import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Paperclip, User, Stethoscope, Eye, X, Upload, Image, Mic, MapPin,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSession } from '../hooks/useSession'
import { queryAgent, uploadFile } from '../utils/api'
import { UserMessage, AssistantMessage } from '../components/MessageComponents'
import PatientContextModal from '../components/PatientContextModal'
import VoiceRecorder from '../components/VoiceRecorder'
import ImageAnalyzer from '../components/ImageAnalyzer'
import DoctorFinder from '../components/DoctorFinder'
import PatientRecordPanel from '../components/PatientRecordPanel'
import MedicalChatbotIcon from '../components/MedicalChatbotIcon'
import { useTranslation } from 'react-i18next'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export default function ChatPage({ isMobile }) {
  const {
    activeSession, activeSessionId, addMessage,
    patientContext, uploadedFiles, addFile,
  } = useSession()

  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPatientModal, setShowPatientModal] = useState(false)
  const [showImagePanel, setShowImagePanel] = useState(false)
  const [showDoctorPanel, setShowDoctorPanel] = useState(false)
  const [showPatientRecord, setShowPatientRecord] = useState(false)
  const [doctorSpecialty, setDoctorSpecialty] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const { t, i18n } = useTranslation()
  const isRTL = i18n.language === 'ar'
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const fileInputRef = useRef(null)

  const messages = activeSession?.messages || []

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Focus input on session change
  useEffect(() => {
    inputRef.current?.focus()
  }, [activeSessionId])

  const handleSubmit = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || isLoading) return

    setInput('')
    setIsLoading(true)

    addMessage(activeSessionId, {
      role: 'user',
      content: trimmed,
      files: uploadedFiles.slice(-3),
      timestamp: new Date(),
    })

    try {
      const response = await queryAgent({
        query: trimmed,
        session_id: activeSessionId,
        patient_context: patientContext,
        file_ids: uploadedFiles.map((f) => f.file_id),
      })

      addMessage(activeSessionId, {
        role: 'assistant',
        report: response.report,
        processing_time_ms: response.processing_time_ms,
        timestamp: new Date(),
      })
    } catch (error) {
      toast.error(`Error: ${error.message}`)
      addMessage(activeSessionId, {
        role: 'assistant',
        report: {
          full_response: `❌ **Connection Error**\n\n${error.message}\n\nMake sure the FastAPI backend is running on port 8000.`,
          tools_used: [],
          alerts: [],
          sources: [],
        },
        processing_time_ms: null,
        timestamp: new Date(),
      })
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, activeSessionId, patientContext, uploadedFiles, addMessage])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileUpload = async (files) => {
    const file = files[0]
    if (!file) return
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Unsupported format. Use: PDF, JPG, PNG, TXT')
      return
    }
    setUploadProgress(0)
    try {
      const result = await uploadFile(file, setUploadProgress)
      addFile(result)
      toast.success(`📄 ${result.filename} imported`)
    } catch (e) {
      toast.error(`Upload error: ${e.message}`)
    } finally {
      setUploadProgress(null)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) handleFileUpload(files)
  }

  const isEmpty = messages.length === 0

  return (
    <div
      className="flex flex-col h-full relative"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {dragOver && (
        <div
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{ 
            background: 'rgba(16, 185, 129, 0.08)', 
            border: '2px dashed rgba(16, 185, 129, 0.4)', 
            borderRadius: 0 
          }}
        >
          <div className="text-center">
            <Upload size={36} className="mx-auto mb-3 text-emerald-400" />
            <p className="text-emerald-600 font-medium text-sm">Drop your medical file</p>
            <p className="text-slate-400 text-xs mt-1">PDF, X-ray (JPG/PNG)</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-emerald-100/60">
        <div className="min-w-0">
          <h1 className="text-sm sm:text-[15px] font-semibold text-slate-800 truncate">
            {activeSession?.title || 'New Consultation'}
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {t('header.agentInfo')}
          </p>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Doctor finder button */}
          <button
            onClick={() => { setDoctorSpecialty(null); setShowDoctorPanel(!showDoctorPanel) }}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all hover:scale-[1.02] ${
              showDoctorPanel
                ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-emerald-200 hover:text-emerald-500'
            }`}
            style={{ border: '1px solid' }}
          >
            <MapPin size={13} />
            <span className="text-[11px] sm:text-xs font-medium hidden sm:inline">Nearby Doctors</span>
          </button>

          {/* Patient Record button */}
          <button
            onClick={() => setShowPatientRecord(!showPatientRecord)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all hover:scale-[1.02] ${
              showPatientRecord
                ? 'bg-amber-50 border-amber-300 text-amber-600'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-amber-200 hover:text-amber-500'
            }`}
            style={{ border: '1px solid' }}
          >
            <FileText size={13} />
            <span className="text-[11px] sm:text-xs font-medium hidden sm:inline">Patient Record</span>
          </button>

          {/* Patient context badge */}
          <button
            onClick={() => setShowPatientModal(true)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl transition-all hover:scale-[1.02] ${
              patientContext
                ? 'bg-teal-50 border-teal-300 text-teal-600'
                : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-teal-200 hover:text-teal-500'
            }`}
            style={{ border: '1px solid' }}
          >
            <User size={13} />
            <span className="text-[11px] sm:text-xs font-medium">
              {patientContext
                ? `Patient ${patientContext.age ? `${patientContext.age}a` : ''} ${patientContext.sex || ''}`
                : <span className="hidden sm:inline">Patient Context</span>}
            </span>
          </button>
        </div>
      </header>

      {/* Messages or Welcome */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <WelcomeScreen isMobile={isMobile} />
        ) : (
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4">
            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <UserMessage key={i} content={msg.content} files={msg.files} />
              ) : (
                <AssistantMessage
                  key={i}
                  report={msg.report}
                  isLoading={false}
                  processingTimeMs={msg.processing_time_ms}
                  onFindDoctor={async (text) => {
                    try {
                      const res = await fetch(`${API_BASE}/doctors/detect-specialty`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ text }),
                      })
                      const data = await res.json()
                      setDoctorSpecialty(data.specialty || null)
                    } catch {
                      setDoctorSpecialty(null)
                    }
                    setShowDoctorPanel(true)
                  }}
                />
              )
            )}
            {isLoading && <AssistantMessage isLoading={true} />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Uploaded files bar */}
      {uploadedFiles.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-2 flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-emerald-100/40">
          <span className="text-[11px] text-slate-400 flex-shrink-0">Files:</span>
          {uploadedFiles.slice(-3).map((f, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
              style={{ 
                background: 'rgba(16, 185, 129, 0.08)', 
                border: '1px solid rgba(16, 185, 129, 0.15)', 
                color: '#059669' 
              }}
            >
              📄 {f.filename}
            </span>
          ))}
        </div>
      )}

      {/* Upload progress */}
      {uploadProgress !== null && (
        <div className="px-4 py-1.5 flex-shrink-0 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ 
                  width: `${uploadProgress}%`, 
                  background: 'linear-gradient(90deg, #10b981, #14b8a6)' 
                }}
              />
            </div>
            <span className="text-[10px] text-slate-400 font-medium">{uploadProgress}%</span>
          </div>
        </div>
      )}

      {/* Patient Record Panel */}
      {showPatientRecord && (
        <div
          className="flex-shrink-0"
          style={{
            borderTop: '1px solid rgba(16, 185, 129, 0.12)',
            background: '#ffffff',
            maxHeight: '75vh',
            overflowY: 'auto',
          }}
        >
          <PatientRecordPanel onClose={() => setShowPatientRecord(false)} />
        </div>
      )}

      {/* Doctor Finder Panel */}
      {showDoctorPanel && (
        <div
          className="flex-shrink-0"
          style={{
            borderTop: '1px solid rgba(16, 185, 129, 0.12)',
            background: '#ffffff',
            maxHeight: '75vh',
            overflowY: 'auto',
          }}
        >
          <DoctorFinder
            initialSpecialty={doctorSpecialty}
            onClose={() => setShowDoctorPanel(false)}
          />
        </div>
      )}

      {/* Image Analysis Panel */}
      {showImagePanel && (
        <div
          className="flex-shrink-0 px-4 py-4"
          style={{ borderTop: '1px solid rgba(16, 185, 129, 0.12)', background: '#ffffff' }}
        >
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Eye size={14} className="text-emerald-500" />
                <span className="text-[13px] font-semibold text-emerald-600">
                  Medical Image Analysis — Groq Vision
                </span>
              </div>
              <button 
                onClick={() => setShowImagePanel(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <ImageAnalyzer
              onAnalysisDone={(analysis, filename, imageUrl) => {
                addMessage(activeSessionId, {
                  role: 'user',
                  content: `[Image analyzed: ${filename}]`,
                  files: [{ url: imageUrl, filename, type: 'image' }],
                  timestamp: new Date(),
                })
                addMessage(activeSessionId, {
                  role: 'assistant',
                  report: {
                    full_response: analysis,
                    tools_used: [{ tool_name: 'analyze_medical_image' }],
                    alerts: [],
                    sources: [],
                  },
                  processing_time_ms: null,
                  timestamp: new Date(),
                })
                setShowImagePanel(false)
              }}
            />
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="flex-shrink-0 px-3 sm:px-4 py-3 sm:py-4 bg-white/90 backdrop-blur-xl border-t border-emerald-100/60">
        <div className="max-w-3xl mx-auto">
          <div
            className="relative rounded-2xl overflow-hidden transition-all duration-300"
            style={{
              background: '#ffffff',
              border: `1.5px solid ${input ? 'rgba(16, 185, 129, 0.35)' : '#e2e8f0'}`,
              boxShadow: input ? '0 0 20px rgba(16, 185, 129, 0.1)' : '0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('chat.placeholder')}
              rows={1}
              disabled={isLoading}
              className="w-full bg-transparent border-none outline-none text-slate-700 text-sm leading-relaxed resize-none font-sans"
              style={{
                padding: '14px 110px 14px 18px',
                maxHeight: '200px',
                overflowY: 'auto',
              }}
              onInput={(e) => {
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
              }}
            />

            {/* Action buttons */}
            <div className="absolute right-3 bottom-3 flex items-center gap-1.5">
              {/* Image analysis toggle */}
              <button
                onClick={() => setShowImagePanel(!showImagePanel)}
                title="Analyze a medical image"
                className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 ${
                  showImagePanel
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-600'
                    : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-200'
                }`}
                style={{ border: '1px solid' }}
              >
                <Image size={13} />
              </button>

              {/* Upload PDF */}
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Upload a PDF"
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 bg-slate-50 border border-slate-200 text-slate-400 hover:text-emerald-500 hover:border-emerald-200"
              >
                <Paperclip size={13} />
              </button>

              {/* Voice recorder */}
              <VoiceRecorder
                onTranscription={(text) => {
                  setInput((prev) => prev ? prev + ' ' + text : text)
                  inputRef.current?.focus()
                }}
                disabled={isLoading}
              />

              {/* Send */}
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                className="w-8 h-8 rounded-xl flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{
                  background: input.trim() && !isLoading
                    ? 'linear-gradient(135deg, #10b981, #14b8a6)'
                    : '#e2e8f0',
                  border: 'none',
                }}
              >
                <Send size={13} color="white" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mt-2 px-1">
            <p className="text-[10px] text-slate-400">
              {t('chat.enterToSend')}
            </p>
            <p className="text-[10px] text-slate-400 flex items-center gap-1">
              <Stethoscope size={10} className="text-emerald-400" />
              {t('chat.medicalUseOnly')}
            </p>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.txt"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFileUpload(Array.from(e.target.files))}
      />

      {/* Patient context modal */}
      {showPatientModal && <PatientContextModal onClose={() => setShowPatientModal(false)} />}
    </div>
  )
}

function WelcomeScreen({ onExample, onStartTyping, isMobile }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 12 } }
  }

  return (
    <motion.div
      className="flex flex-col items-center justify-center h-full px-4 sm:px-6 py-6 sm:py-10 overflow-y-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Hero with 3D Icon */}
      <motion.div className="text-center mb-6 sm:mb-8 max-w-xl w-full" variants={itemVariants}>
        <div className="flex justify-center mb-5 sm:mb-6">
          <MedicalChatbotIcon size={isMobile ? 'lg' : '2xl'} animate={true} />
        </div>

        <motion.h1
          className="font-display text-3xl sm:text-4xl lg:text-5xl font-light text-slate-800 mb-3 leading-tight"
          variants={itemVariants}
        >
          Medi<span className="gradient-text italic">Agent</span>
        </motion.h1>
        <motion.p
          className="text-sm sm:text-base text-slate-500 mt-2 leading-relaxed max-w-md mx-auto"
          variants={itemVariants}
        >
          AI Clinical Assistant with multi-step reasoning
          <span className="hidden sm:inline"> — Diagnosis, Interactions, Scores, Literature & Vision</span>
        </motion.p>
      </motion.div>

      {/* Subtle tagline */}
      <motion.div
        className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mt-2 mb-4"
        variants={itemVariants}
      >
        {['Diagnosis', 'Drug Interactions', 'Risk Scores', 'Medical Vision'].map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 rounded-full text-[11px] sm:text-xs font-medium bg-white/60 border border-emerald-100 text-slate-500"
          >
            {tag}
          </span>
        ))}
      </motion.div>

      {/* Tap to start hint */}
      <motion.p
        className="text-[11px] text-slate-400 mt-4 text-center"
        variants={itemVariants}
      >
        Type a question below to start your consultation
      </motion.p>
    </motion.div>
  )
}

