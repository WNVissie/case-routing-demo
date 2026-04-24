import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { REGIONS } from '../data/seed.js'
import { routeCase, generateCaseNumber } from '../utils/routing.js'
import { notifyAssignment } from '../utils/telegram.js'

// ── Success card shown after submission ───────────────────────

function SuccessCard({ caseData, onAnother }) {
  const techColor = caseData.assignedTechnicianName !== 'Unassigned'
    ? 'bg-green-50 border-green-200'
    : 'bg-yellow-50 border-yellow-200'

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <div className="card text-center">
        <div className="text-4xl mb-3">✅</div>
        <h2 className="text-xl font-bold text-gray-900">Case Created</h2>
        <p className="text-3xl font-mono font-bold text-blue-700 mt-2">{caseData.caseNumber}</p>
        <p className="text-sm text-gray-500 mt-1">
          {new Date(caseData.createdAt).toLocaleString()}
        </p>
      </div>

      <div className={`card border-2 ${techColor}`}>
        <h3 className="font-semibold text-gray-800 mb-2">Routing Decision</h3>
        <p className="text-sm text-gray-700">{caseData.routingReason}</p>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs text-gray-500">Assigned to:</span>
          <span className="font-semibold text-blue-800 text-sm">{caseData.assignedTechnicianName}</span>
        </div>
        {caseData.telegramSent && (
          <p className="text-xs text-green-600 mt-2">📱 Telegram notification sent to technician</p>
        )}
        {!caseData.telegramSent && (
          <p className="text-xs text-gray-400 mt-2">📵 Telegram not configured — notification skipped</p>
        )}
      </div>

      <div className="flex gap-3">
        <Link to="/cases" className="btn-primary flex-1 text-center">
          View Case List →
        </Link>
        <button onClick={onAnother} className="btn-secondary flex-1">
          Log Another Case
        </button>
      </div>
    </div>
  )
}

// ── Contact preference section (shared by new & existing customer) ──

function ContactSection({ pref, onChange, demoChatId }) {
  return (
    <div className="space-y-3">
      <div>
        <label className="label">How do you want to be contacted? *</label>
        <div className="flex gap-4 mt-1">
          {['email', 'telegram'].map((opt) => (
            <label
              key={opt}
              className={`flex-1 text-center py-2 rounded-lg border-2 cursor-pointer text-sm font-medium transition-colors
                ${pref.preference === opt
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}
            >
              <input
                type="radio"
                name="contactPreference"
                value={opt}
                className="sr-only"
                checked={pref.preference === opt}
                onChange={() => onChange({
                  preference: opt,
                  email: '',
                  telegramChatId: opt === 'telegram' ? (demoChatId || '') : '',
                })}
              />
              {opt === 'email' ? '✉️ Email' : '📱 Telegram'}
            </label>
          ))}
        </div>
      </div>

      {pref.preference === 'email' && (
        <div>
          <label className="label">Email Address *</label>
          <input
            className="input"
            type="email"
            placeholder="customer@example.com"
            value={pref.email}
            onChange={(e) => onChange({ ...pref, email: e.target.value })}
          />
        </div>
      )}

      {pref.preference === 'telegram' && (
        <div>
          <label className="label">Telegram Chat ID *</label>
          <input
            className="input"
            type="text"
            placeholder="e.g. 123456789"
            value={pref.telegramChatId}
            onChange={(e) => onChange({ ...pref, telegramChatId: e.target.value })}
          />
          <p className="text-xs text-gray-400 mt-1">
            To find your Chat ID: open Telegram and message{' '}
            <span className="font-mono bg-gray-100 px-1 rounded">@userinfobot</span> — it replies with your numeric ID.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────

export default function CaseFormPage() {
  const { state, dispatch } = useApp()

  // Step 1 — customer selection
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedAsset, setSelectedAsset]       = useState(null)
  const [showNewForm, setShowNewForm]            = useState(false)

  // New customer fields
  const [newCust, setNewCust] = useState({
    name: '', customerNumber: '', region: REGIONS[0],
  })

  // Contact preference — used for both new and existing customers
  const [contactPref, setContactPref] = useState({ preference: 'email', email: '', telegramChatId: '' })

  // Step — who is logging
  const [loggedBy, setLoggedBy] = useState('')

  // Step — photos (up to 2, stored as base64)
  const [photos, setPhotos] = useState([])

  // Step 3 — case details
  const [description, setDescription] = useState('')
  const [priority, setPriority]       = useState('medium')

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(null)

  // When an existing customer is selected, pre-fill contactPref from their stored data
  // Fall back to demoChatId for telegram if customer has none
  useEffect(() => {
    if (selectedCustomer) {
      const chatId = selectedCustomer.telegramChatId || state.demoChatId || ''
      setContactPref({
        preference:     chatId ? 'telegram' : (selectedCustomer.email ? 'email' : 'email'),
        email:          selectedCustomer.email || '',
        telegramChatId: chatId,
      })
    }
  }, [selectedCustomer])

  // ── handlers ──

  function pickCustomer(customer) {
    setSelectedCustomer(customer)
    setSelectedAsset(null)
    setShowNewForm(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!description.trim()) return

    // Validate contact info
    if (contactPref.preference === 'email' && !contactPref.email.trim()) {
      alert('Please enter an email address.')
      return
    }
    if (contactPref.preference === 'telegram' && !contactPref.telegramChatId.trim()) {
      alert('Please enter a Telegram Chat ID.')
      return
    }

    setSubmitting(true)

    let customer = selectedCustomer

    if (showNewForm && !selectedCustomer) {
      if (!newCust.name.trim() || !newCust.customerNumber.trim()) {
        alert('Please fill in customer name and customer number.')
        setSubmitting(false)
        return
      }
      customer = {
        ...newCust,
        id: `CUST-${Date.now()}`,
        email:          contactPref.preference === 'email'     ? contactPref.email         : '',
        telegramChatId: contactPref.preference === 'telegram'  ? contactPref.telegramChatId : '',
      }
      dispatch({ type: 'ADD_CUSTOMER', payload: customer })
    } else if (selectedCustomer) {
      // Update contact info if it changed
      const updated = {
        ...selectedCustomer,
        email:          contactPref.preference === 'email'     ? contactPref.email         : selectedCustomer.email,
        telegramChatId: contactPref.preference === 'telegram'  ? contactPref.telegramChatId : selectedCustomer.telegramChatId,
      }
      dispatch({ type: 'UPDATE_CUSTOMER', payload: updated })
      customer = updated
    }

    if (!customer) {
      alert('Please select or create a customer first.')
      setSubmitting(false)
      return
    }

    // ── AGENT-LIKE ROUTING ─────────────────────────────────────
    const { technician: routedTech, reason } = routeCase(customer.region)
    // Get the live technician record from state (has editable telegramChatId)
    const technician = routedTech
      ? state.technicians.find((t) => t.id === routedTech.id) ?? routedTech
      : null
    // ──────────────────────────────────────────────────────────

    const caseId     = `case-${Date.now()}`
    const caseNumber = generateCaseNumber(state.cases)

    const newCase = {
      id:                    caseId,
      caseNumber,
      customerId:            customer.id,
      customerName:          customer.name,
      customerNumber:        customer.customerNumber,
      assetId:               selectedAsset?.id          ?? null,
      assetNumber:           selectedAsset?.assetNumber  ?? null,
      assetDescription:      selectedAsset?.description  ?? null,
      region:                customer.region,
      description,
      priority,
      assignedTechnicianId:  technician?.id   ?? null,
      assignedTechnicianName: technician?.name ?? 'Unassigned',
      routingReason:         reason,
      loggedBy:              loggedBy.trim() || null,
      photos:                photos,
      status:                'open',
      confirmed:             false,
      confirmedAt:           null,
      createdAt:             new Date().toISOString(),
      closedAt:              null,
      closureNote:           null,
      feedback:              null,
      feedbackComment:       null,
      telegramSent:          false,
    }

    dispatch({ type: 'ADD_CASE', payload: newCase })

    // ── TELEGRAM: notify the assigned technician ───────────────
    if (technician) {
      const sent = await notifyAssignment({
        technicianId:   technician.id,
        technicianName: technician.name,
        techChatId:     technician.telegramChatId || state.demoChatId || '',
        caseNumber,
        caseId,
        customerName:   customer.name,
        region:         customer.region,
        description,
        priority,
        loggedBy:       loggedBy.trim() || null,
      })
      newCase.telegramSent = sent
    }
    // ──────────────────────────────────────────────────────────

    setSubmitted(newCase)
    setSubmitting(false)
  }

  async function handlePhotoChange(e) {
    const files = Array.from(e.target.files).slice(0, 2)
    const toBase64 = (file) => new Promise((resolve, reject) => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`"${file.name}" is over 2 MB. Please use a smaller image.`)
        reject()
        return
      }
      const reader = new FileReader()
      reader.onload  = (ev) => resolve(ev.target.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
    try {
      const results = await Promise.all(files.map(toBase64))
      setPhotos(results)
    } catch { /* file rejected */ }
  }

  function reset() {
    setSelectedCustomer(null); setSelectedAsset(null)
    setShowNewForm(false)
    setNewCust({ name: '', customerNumber: '', region: REGIONS[0] })
    setContactPref({ preference: 'email', email: '', telegramChatId: '' })
    setLoggedBy(''); setPhotos([])
    setDescription(''); setPriority('medium')
    setSubmitted(null)
  }

  // ── render ──

  if (submitted) {
    return <SuccessCard caseData={submitted} onAnother={reset} />
  }

  const customerAssets = selectedCustomer
    ? state.assets.filter((a) => a.customerId === selectedCustomer.id)
    : []

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Log a New Service Case</h1>
        <p className="text-sm text-gray-500 mt-1">
          Select an existing customer or create a new one.
        </p>
      </div>

      {/* ── Step 1: Select Customer ── */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs mr-2">1</span>
          Select Customer
        </h2>

        <select
          className="input"
          value={selectedCustomer?.id || ''}
          onChange={(e) => {
            const val = e.target.value
            if (!val) { setSelectedCustomer(null); setSelectedAsset(null); setShowNewForm(false); return }
            const cust = state.customers.find((c) => c.id === val)
            if (cust) pickCustomer(cust)
          }}
        >
          <option value="">— Select a customer —</option>
          {state.customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.customerNumber})
            </option>
          ))}
        </select>

        {selectedCustomer && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <span className="font-medium text-green-800">{selectedCustomer.name}</span>
            <span className="text-xs text-green-600 ml-2">{selectedCustomer.customerNumber} · {selectedCustomer.region}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => { setShowNewForm(true); setSelectedCustomer(null); setSelectedAsset(null); setContactPref({ preference: state.demoChatId ? 'telegram' : 'email', email: '', telegramChatId: state.demoChatId || '' }) }}
          className="mt-3 text-sm text-blue-600 hover:underline"
        >
          + Create new customer
        </button>
      </div>

      {/* ── New customer form ── */}
      {showNewForm && !selectedCustomer && (
        <div className="card border-yellow-300 border">
          <h2 className="font-semibold text-gray-800 mb-4">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-white text-xs mr-2">+</span>
            New Customer
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Customer Name *</label>
                <input className="input" value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Customer Number *</label>
                <input className="input" placeholder="e.g. C-0010" value={newCust.customerNumber}
                  onChange={(e) => setNewCust({ ...newCust, customerNumber: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Region *</label>
                <select className="input" value={newCust.region}
                  onChange={(e) => setNewCust({ ...newCust, region: e.target.value })}>
                  {REGIONS.map((r) => <option key={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <ContactSection pref={contactPref} onChange={setContactPref} demoChatId={state.demoChatId} />
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Region determines which technician will be assigned. See the Technician Map for routing rules.
          </p>
        </div>
      )}

      {/* ── Contact method (existing customer) ── */}
      {selectedCustomer && (
        <div className="card border-blue-200 border">
          <h2 className="font-semibold text-gray-800 mb-4">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs mr-2">2</span>
            Contact Method
          </h2>
          <ContactSection pref={contactPref} onChange={setContactPref} />
        </div>
      )}

      {/* ── Asset (shown after customer confirmed) ── */}
      {(selectedCustomer || showNewForm) && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs mr-2">
              {selectedCustomer ? '3' : '2'}
            </span>
            Asset <span className="text-gray-400 font-normal text-sm">(optional)</span>
          </h2>

          {selectedCustomer && customerAssets.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-1">Select a registered asset or leave unselected for a general issue:</p>
              {customerAssets.map((a) => (
                <label key={a.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="asset"
                    value={a.id}
                    checked={selectedAsset?.id === a.id}
                    onChange={() => setSelectedAsset(a)}
                  />
                  <span className="font-mono text-sm text-blue-700">{a.assetNumber}</span>
                  <span className="text-sm text-gray-600">{a.description}</span>
                </label>
              ))}
              <label className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="asset"
                  value=""
                  checked={!selectedAsset}
                  onChange={() => setSelectedAsset(null)}
                />
                <span className="text-sm text-gray-500 italic">No specific asset (general issue)</span>
              </label>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {selectedCustomer
                ? 'No assets registered for this customer. The case will be logged as a general issue.'
                : 'Asset selection available after customer is identified.'}
            </p>
          )}
        </div>
      )}

      {/* ── Case details ── */}
      {(selectedCustomer || showNewForm) && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="font-semibold text-gray-800">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs mr-2">
              {selectedCustomer ? '4' : '3'}
            </span>
            Case Details
          </h2>

          <div>
            <label className="label">Your Name (person logging this call)</label>
            <input
              className="input"
              placeholder="e.g. Jane Smith"
              value={loggedBy}
              onChange={(e) => setLoggedBy(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Description *</label>
            <textarea
              className="input min-h-[90px] resize-y"
              placeholder="Describe the issue clearly…"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="label">Priority</label>
            <div className="flex gap-3">
              {['low', 'medium', 'high'].map((p) => (
                <label key={p} className={`flex-1 text-center py-2 rounded-lg border-2 cursor-pointer text-sm font-medium transition-colors
                  ${priority === p
                    ? p === 'high'   ? 'border-red-500 bg-red-50 text-red-700'
                    : p === 'medium' ? 'border-yellow-400 bg-yellow-50 text-yellow-700'
                    :                  'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  <input
                    type="radio" name="priority" value={p} className="sr-only"
                    checked={priority === p}
                    onChange={() => setPriority(p)}
                  />
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="label">
              Photos <span className="text-gray-400 font-normal">(optional — up to 2, max 2 MB each)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoChange}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
            />
            {photos.length > 0 && (
              <div className="flex gap-3 mt-3 flex-wrap">
                {photos.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt={`Preview ${i + 1}`}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => setPhotos((p) => p.filter((_, j) => j !== i))}
                      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="btn-primary w-full py-3 text-base" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Case & Auto-Route →'}
          </button>
        </form>
      )}
    </div>
  )
}
