import { useState, useRef } from 'react'
import { Image as ImageIcon, X, Loader2, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function ImageAnalyzer({ onAnalysisDone }) {
  const [preview, setPreview] = useState(null)
  const[file, setFile] = useState(null)
  const [context, setContext] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const fileInputRef = useRef(null)

  const handleFile = (f) => {
    if (!f || !f.type.startsWith('image/')) return toast.error('Image requise')
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const analyze = async () => {
    if (!file) return
    setIsAnalyzing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      if (context) formData.append('context', context)

      const response = await fetch(`${API_BASE}/vision/analyze`, { method: 'POST', body: formData })
      const data = await response.json()
      setResult(data.analysis)

      if (onAnalysisDone) {
        onAnalysisDone(data.analysis, file.name, preview) // ENVOIE L'URL DE L'IMAGE
      }
    } catch (err) { toast.error(`Erreur: ${err.message}`) } 
    finally { setIsAnalyzing(false) }
  }

  return (
    <div className="flex flex-col gap-4">
      {!preview ? (
        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-700 p-10 rounded-xl text-center cursor-pointer hover:border-blue-500">
          <ImageIcon size={32} className="mx-auto text-blue-400 mb-2" />
          <p className="text-slate-300">Cliquez pour ajouter une image médicale</p>
        </div>
      ) : (
        <div className="relative rounded-xl overflow-hidden border border-slate-700">
          <img src={preview} style={{ width: '100%', maxHeight: 300, objectFit: 'contain', background: '#000' }} />
          <button onClick={() => setPreview(null)} className="absolute top-2 right-2 p-1 bg-black/60 text-white rounded"><X size={16}/></button>
        </div>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      {preview && (
        <button onClick={analyze} disabled={isAnalyzing} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2">
          {isAnalyzing ? <Loader2 className="animate-spin" /> : <Eye />} {isAnalyzing ? "Analyse..." : "Analyser l'image"}
        </button>
      )}
    </div>
  )
}