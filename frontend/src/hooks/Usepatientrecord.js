import { useState, useEffect, useCallback } from 'react'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function usePatientRecord(patientId) {
  const [record, setRecord] = useState({ name: 'Anonyme', age: '', sex: '' })
  const[consultations, setConsultations] = useState([])
  const [alerts, setAlerts] = useState([])
  const[scoreEvolution, setScoreEvolution] = useState([])

  const storageKey = `patient_record_${patientId || 'default'}`

  useEffect(() => {
    const stored = localStorage.getItem(storageKey)
    if (stored) {
      try {
        const data = JSON.parse(stored)
        if (data.record) setRecord(data.record)
        if (data.consultations) setConsultations(data.consultations)
        if (data.alerts) setAlerts(data.alerts)
        if (data.scoreEvolution) setScoreEvolution(data.scoreEvolution)
      } catch (e) { console.error('Erreur JSON:', e) }
    }
  }, [storageKey])

  const saveAll = (newRecord, newConsults, newAlerts, newScores) => {
    localStorage.setItem(storageKey, JSON.stringify({
      record: newRecord || record,
      consultations: newConsults || consultations,
      alerts: newAlerts || alerts,
      scoreEvolution: newScores || scoreEvolution,
    }))
  }

  const addConsultation = useCallback(async (data) => {
    const newConsult = {
      id: `consult_${Date.now()}`,
      date: data.date || new Date().toISOString(),
      query: data.query,
      diagnosis: data.diagnosis || "Analyse clinique",
      treatment: data.treatment || "Suivi standard",
      files: data.files ||[],
      score: data.score || null
    }

    const updatedConsults = [newConsult, ...consultations]
    setConsultations(updatedConsults)
    saveAll(record, updatedConsults, alerts, scoreEvolution)
    return newConsult
  }, [consultations, record, alerts, scoreEvolution, storageKey])

  const deleteConsultation = (id) => {
    const updated = consultations.filter(c => c.id !== id)
    setConsultations(updated)
    saveAll(record, updated, alerts, scoreEvolution)
  }

  const generateReport = async (id) => {
    const consult = consultations.find(c => c.id === id)
    return consult ? `# RAPPORT\n\n**Symptômes:** ${consult.query}\n\n**Diagnostic:**\n${consult.diagnosis}` : ""
  }

  return {
    record, consultations, alerts, scoreEvolution, 
    addConsultation, deleteConsultation, generateReport,
    getStats: () => ({ totalConsultations: consultations.length })
  }
}