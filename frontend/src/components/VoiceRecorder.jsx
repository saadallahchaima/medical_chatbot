import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Loader2, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export default function VoiceRecorder({ onTranscription, disabled }) {
  const [state, setState] = useState('idle') // idle | recording | transcribing | done
  const [seconds, setSeconds] = useState(0)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Choose the best supported format
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        clearInterval(timerRef.current)

        const blob = new Blob(chunksRef.current, { type: mimeType })
        await transcribeAudio(blob, mimeType)
      }

      recorder.start(100) // 100ms chunks
      setState('recording')
      setSeconds(0)

      // Timer
      timerRef.current = setInterval(() => {
        setSeconds((s) => {
          if (s >= 59) {
            stopRecording()
            return 60
          }
          return s + 1
        })
      }, 1000)

    } catch (err) {
      if (err.name === 'NotAllowedError') {
        toast.error('Microphone denied — allow microphone in your browser')
      } else {
        toast.error(`Microphone error: ${err.message}`)
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      setState('transcribing')
    }
  }

  const transcribeAudio = async (blob, mimeType) => {
    try {
      const ext = mimeType.includes('mp4') ? 'm4a' : 'webm'
      const formData = new FormData()
      formData.append('file', blob, `voice.${ext}`)
      formData.append('language', 'en')

      const response = await fetch(`${API_BASE}/audio/transcribe`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Transcription error')
      }

      const data = await response.json()

      if (data.text) {
        setState('done')
        onTranscription(data.text)
        toast.success(`🎙️ Transcribed: "${data.text.slice(0, 40)}..."`)
        setTimeout(() => setState('idle'), 2000)
      } else {
        throw new Error('Empty transcription')
      }
    } catch (err) {
      toast.error(`Transcription failed: ${err.message}`)
      setState('idle')
    }
  }

  const handleClick = () => {
    if (disabled) return
    if (state === 'idle' || state === 'done') startRecording()
    else if (state === 'recording') stopRecording()
  }

  // Styles according to state
  const styles = {
    idle: { bg: 'var(--bg-elevated)', border: 'var(--border-default)', color: 'var(--text-muted)', title: 'Speak' },
    recording: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.5)', color: '#f87171', title: 'Stop' },
    transcribing: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', color: '#fbbf24', title: '...' },
    done: { bg: 'rgba(16,185,129,0.15)', border: 'rgba(16,185,129,0.4)', color: '#34d399', title: 'OK' },
  }
  const s = styles[state]

  return (
    <button
      onClick={handleClick}
      disabled={disabled || state === 'transcribing'}
      title={state === 'idle' ? 'Record a voice message' : state === 'recording' ? 'Stop recording' : ''}
      className="relative w-8 h-8 rounded-xl flex items-center justify-center transition-all"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
        cursor: disabled || state === 'transcribing' ? 'not-allowed' : 'pointer',
      }}
    >
      {state === 'idle' && <Mic size={13} />}
      {state === 'recording' && (
        <>
          <MicOff size={13} />
          {/* Pulse ring */}
          <span
            className="absolute inset-0 rounded-xl animate-ping"
            style={{ background: 'rgba(239,68,68,0.2)' }}
          />
          {/* Timer */}
          <span
            className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-mono"
            style={{ color: '#f87171', fontSize: '10px' }}
          >
            {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
          </span>
        </>
      )}
      {state === 'transcribing' && <Loader2 size={13} className="animate-spin" />}
      {state === 'done' && <CheckCircle size={13} />}
    </button>
  )
}
