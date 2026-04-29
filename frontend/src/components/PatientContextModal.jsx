import { useState } from 'react'
import { X, User, Plus, Trash2 } from 'lucide-react'
import { useSession } from '../hooks/useSession'
import toast from 'react-hot-toast'

export default function PatientContextModal({ onClose }) {
  const { patientContext, setPatientContext } = useSession()
  const [form, setForm] = useState(patientContext || {
    age: '',
    sex: '',
    weight_kg: '',
    allergies: [],
    current_medications: [],
    chronic_conditions: [],
    chief_complaint: '',
  })
  const [newAllergy, setNewAllergy] = useState('')
  const [newMed, setNewMed] = useState('')
  const [newCondition, setNewCondition] = useState('')

  const addItem = (field, value, setter) => {
    if (!value.trim()) return
    setForm((f) => ({ ...f, [field]: [...(f[field] || []), value.trim()] }))
    setter('')
  }

  const removeItem = (field, idx) => {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== idx) }))
  }

  const handleSave = () => {
    const ctx = {
      ...form,
      age: form.age ? parseInt(form.age) : undefined,
      weight_kg: form.weight_kg ? parseFloat(form.weight_kg) : undefined,
    }
    // Clean empty fields
    Object.keys(ctx).forEach((k) => {
      if (ctx[k] === '' || ctx[k] === undefined) delete ctx[k]
      if (Array.isArray(ctx[k]) && ctx[k].length === 0) delete ctx[k]
    })
    setPatientContext(Object.keys(ctx).length > 0 ? ctx : null)
    toast.success('Contexte patient enregistré')
    onClose()
  }

  const inputStyle = {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-default)',
    borderRadius: '10px',
    color: 'var(--text-primary)',
    padding: '8px 12px',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
    fontFamily: 'DM Sans, sans-serif',
  }

  const labelStyle = {
    fontSize: '11px',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
    display: 'block',
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-card w-full max-w-lg max-h-[85vh] overflow-y-auto"
        style={{ padding: '28px', margin: '16px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(37, 99, 235, 0.3)' }}
            >
              <User size={15} style={{ color: '#60a5fa' }} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>
                Contexte Patient
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Informations enrichissant les réponses de l'agent
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Motif principal */}
        <div className="mb-4">
          <label style={labelStyle}>Motif de consultation</label>
          <textarea
            value={form.chief_complaint}
            onChange={(e) => setForm((f) => ({ ...f, chief_complaint: e.target.value }))}
            placeholder="Ex: Douleur thoracique depuis 2h, irradiant au bras gauche..."
            rows={2}
            style={{ ...inputStyle, resize: 'none' }}
          />
        </div>

        {/* Données de base */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label style={labelStyle}>Âge (ans)</label>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
              placeholder="65"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Sexe</label>
            <select
              value={form.sex}
              onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}
              style={{ ...inputStyle, cursor: 'pointer' }}
            >
              <option value="">—</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
              <option value="autre">Autre</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Poids (kg)</label>
            <input
              type="number"
              value={form.weight_kg}
              onChange={(e) => setForm((f) => ({ ...f, weight_kg: e.target.value }))}
              placeholder="70"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Allergies */}
        <ListField
          label="Allergies"
          items={form.allergies}
          value={newAllergy}
          onChange={setNewAllergy}
          onAdd={() => addItem('allergies', newAllergy, setNewAllergy)}
          onRemove={(i) => removeItem('allergies', i)}
          placeholder="Ex: Pénicilline, AINS..."
          color="#f87171"
        />

        {/* Médicaments */}
        <ListField
          label="Traitements en cours"
          items={form.current_medications}
          value={newMed}
          onChange={setNewMed}
          onAdd={() => addItem('current_medications', newMed, setNewMed)}
          onRemove={(i) => removeItem('current_medications', i)}
          placeholder="Ex: Metformine 1g, Ramipril 5mg..."
          color="#fbbf24"
        />

        {/* Antécédents */}
        <ListField
          label="Antécédents / Pathologies chroniques"
          items={form.chronic_conditions}
          value={newCondition}
          onChange={setNewCondition}
          onAdd={() => addItem('chronic_conditions', newCondition, setNewCondition)}
          onRemove={(i) => removeItem('chronic_conditions', i)}
          placeholder="Ex: Diabète T2, HTA, BPCO..."
          color="#34d399"
        />

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => { setPatientContext(null); onClose() }}
            className="flex-1 py-2.5 rounded-xl transition-colors"
            style={{ border: '1px solid var(--border-default)', color: 'var(--text-muted)', fontSize: '13px' }}
          >
            Effacer le contexte
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl font-medium transition-all hover:scale-[1.02]"
            style={{
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.8), rgba(20, 184, 166, 0.8))',
              color: 'white',
              fontSize: '13px',
              border: 'none',
            }}
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  )
}

function ListField({ label, items, value, onChange, onAdd, onRemove, placeholder, color }) {
  const handleKey = (e) => e.key === 'Enter' && onAdd()

  return (
    <div className="mb-4">
      <label style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', display: 'block' }}>
        {label}
      </label>
      <div className="flex gap-2 mb-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: '10px',
            color: 'var(--text-primary)',
            padding: '7px 12px',
            fontSize: '12.5px',
            outline: 'none',
            fontFamily: 'DM Sans, sans-serif',
          }}
        />
        <button
          onClick={onAdd}
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
          style={{ background: `${color}20`, border: `1px solid ${color}40`, color }}
        >
          <Plus size={13} />
        </button>
      </div>
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {items.map((item, i) => (
            <span
              key={i}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
              style={{ background: `${color}15`, border: `1px solid ${color}35`, color }}
            >
              {item}
              <button onClick={() => onRemove(i)} className="hover:opacity-70 transition-opacity">
                <Trash2 size={9} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
