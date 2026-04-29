import { createContext, useContext, useState, useCallback } from 'react'

// UUID v4 inline — pas de dépendance externe
const uuidv4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  const [sessions, setSessions] = useState([
    { id: uuidv4(), title: 'New Consultation', messages: [], createdAt: new Date() },
  ])
  const [activeSessionId, setActiveSessionId] = useState(sessions[0].id)
  const [patientContext, setPatientContext] = useState(null)
  const [uploadedFiles, setUploadedFiles] = useState([])

  const activeSession = sessions.find((s) => s.id === activeSessionId)

  const createSession = useCallback(() => {
    const newSession = {
      id: uuidv4(),
      title: 'New Consultation',
      messages: [],
      createdAt: new Date(),
    }
    setSessions((prev) => [newSession, ...prev])
    setActiveSessionId(newSession.id)
    setUploadedFiles([])
    return newSession.id
  }, [])

  const addMessage = useCallback((sessionId, message) => {
    setSessions((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s
        const messages = [...s.messages, message]
        // Auto-title from first user message
        const title =
          s.messages.length === 0 && message.role === 'user'
            ? message.content.slice(0, 45) + (message.content.length > 45 ? '…' : '')
            : s.title
        return { ...s, messages, title }
      })
    )
  }, [])

  const addFile = useCallback((file) => {
    setUploadedFiles((prev) => [...prev, file])
  }, [])

  return (
    <SessionContext.Provider
      value={{
        sessions,
        activeSessionId,
        activeSession,
        patientContext,
        uploadedFiles,
        setActiveSessionId,
        createSession,
        addMessage,
        addFile,
        setPatientContext,
      }}
    >
      {children}
    </SessionContext.Provider>
  )
}

export const useSession = () => {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be inside SessionProvider')
  return ctx
}
