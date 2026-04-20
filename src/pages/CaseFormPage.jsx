import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { REGIONS } from '../data/seed.js'
import { routeCase, generateCaseNumber } from '../utils/routing.js'
import { notifyAssignment } from '../utils/telegram.js'

// ── helpers ──────────────────────────────────────────────────

function search(term, customers, assets) {
  const t = term.toLowerCase().trim()
  if (!t) return []

  // Match customer name or customer number
  const byCustomer = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(t) ||
      c.customerNumber.toLowerCase().includes(t)
  )

  // Match asset number → resolve to owning customer
  const byAsset = assets
    .filter((a) => a.assetNumber.toLowerCase().includes(t))
    .map((a) => ({
      customer: customers.find((c) => c.id === a.customerId),
      matchedAsset: a,
    }))
    .filter((r) => r.customer)

  // Merge, deduplicate by customer id
  const seen = new Set()
  const results = []
  for (const r of [...byCustomer.map((c) => ({ customer: c, matchedAsset: null })), ...byAsset]) {
    if (!seen.has(r.customer.id)) {
      seen.add(r.customer.id)
      results.push(r)
    }
  }
  return results
}

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

      {/* Routing decision — the key "agent-like" output */}
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

// ── Main page ────────────────────────────────────────────────

export default function CaseFormPage() {
  const { state, dispatch } = useApp()

  // Step 1 — search
  const [searchTerm, setSearchTerm]     = useState('')
  const [searchResults, setSearchResults] = useState(null) // null = not yet searched

  // Step 2 — customer
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [selectedAsset, setSelectedAsset]       = useState(null)
  const [showNewForm, setShowNewForm]            = useState(false)
  const [newCust, setNewCust] = useState({
    name: '', customerNumber: '', region: REGIONS[0], email: '',
  })

  // Step 3 — case details
  const [description, setDescription] = useState('')
  const [priority, setPriority]       = useState('medium')

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(null)

  // ── handlers ──

  function handleSearch(e) {
    e.preventDefault()
    const results = search(searchTerm, state.customers, state.assets)
    setSearchResults(results)
    setSelectedCustomer(null)
    setSelectedAsset(null)
    setShowNewForm(results.length === 0)
  }

  function pickCustomer(customer, matchedAsset) {
    setSelectedCustomer(customer)
    setSelectedAsset(matchedAsset)
    setShowNewForm(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!description.trim()) return

    setSubmitting(true)

    // If creating a new customer, add them to state first
    let customer = selectedCustomer
    if (showNewForm && !selectedCustomer) {
      if (!newCust.name.trim() || !newCust.customerNumber.trim()) {
        alert('Please fill in customer name and customer number.')
        setSubmitting(false)
        return
      }
      customer = { ...newCust, id: `CUST-${Date.now()}` }
      dispatch({ type: 'ADD_CUSTOMER', payload: customer })
    }

    if (!customer) {
      alert('Please select or create a customer first.')
      setSubmitting(false)
      return
    }

    // ── AGENT-LIKE ROUTING ─────────────────────────────────────
    // This is where the system automatically decides which
    // technician handles the case based on the customer's region.
    const { technician, reason } = routeCase(customer.region)
    // ──────────────────────────────────────────────────────────

    const caseId     = `case-${Date.now()}`
    const caseNumber = generateCaseNumber(state.cases)

    const newCase = {
      id:                    caseId,
      caseNumber,
      customerId:            customer.id,
      customerName:          customer.name,
      customerNumber:        customer.customerNumber,
      assetId:               selectedAsset?.id   ?? null,
      assetNumber:           selectedAsset?.assetNumber   ?? null,
      assetDescription:      selectedAsset?.description   ?? null,
      region:                customer.region,
      description,
      priority,
      assignedTechnicianId:  technician?.id   ?? null,
      assignedTechnicianName: technician?.name ?? 'Unassigned',
      routingReason:         reason,
      status:                'open',
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
        caseNumber,
        customerName:   customer.name,
        region:         customer.region,
        description,
        priority,
      })
      newCase.telegramSent = sent
    }
    // ──────────────────────────────────────────────────────────

    setSubmitted(newCase)
    setSubmitting(false)
  }

  function reset() {
    setSearchTerm(''); setSearchResults(null)
    setSelectedCustomer(null); setSelectedAsset(null)
    setShowNewForm(false)
    setNewCust({ name: '', customerNumber: '', region: REGIONS[0], email: '' })
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
          Search for an existing customer or create a new one.
        </p>
      </div>

      {/* ── Step 1: Search ── */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-3">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs mr-2">1</span>
          Find Customer
        </h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Customer name, customer number (C-0001), or asset number (A-1001)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn-primary whitespace-nowrap">Search</button>
        </form>

        {/* Results */}
        {searchResults !== null && searchResults.length > 0 && !selectedCustomer && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-gray-500">{searchResults.length} result(s) found — click to select:</p>
            {searchResults.map(({ customer, matchedAsset }) => (
              <button
                key={customer.id}
                onClick={() => pickCustomer(customer, matchedAsset)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-medium text-gray-900">{customer.name}</span>
                    <span className="ml-2 text-xs text-gray-400">{customer.customerNumber}</span>
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {customer.region}
                  </span>
                </div>
                {matchedAsset && (
                  <p className="text-xs text-green-600 mt-1">
                    Matched asset: {matchedAsset.assetNumber} — {matchedAsset.description}
                  </p>
                )}
              </button>
            ))}
            <button
              onClick={() => { setShowNewForm(true); setSelectedCustomer(null) }}
              className="text-sm text-blue-600 hover:underline"
            >
              Not the right customer? Create a new entry →
            </button>
          </div>
        )}

        {searchResults !== null && searchResults.length === 0 && !showNewForm && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
            No customer found. The new customer form is shown below.
          </div>
        )}

        {/* Selected customer confirmation */}
        {selectedCustomer && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
            <div>
              <span className="font-medium text-green-800">{selectedCustomer.name}</span>
              <span className="text-xs text-green-600 ml-2">{selectedCustomer.customerNumber} · {selectedCustomer.region}</span>
            </div>
            <button onClick={() => setSelectedCustomer(null)} className="text-xs text-gray-400 hover:text-gray-700">
              Change
            </button>
          </div>
        )}
      </div>

      {/* ── New customer form ── */}
      {showNewForm && !selectedCustomer && (
        <div className="card border-yellow-300 border">
          <h2 className="font-semibold text-gray-800 mb-4">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-white text-xs mr-2">+</span>
            New Customer
          </h2>
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
            <div>
              <label className="label">Region *</label>
              <select className="input" value={newCust.region}
                onChange={(e) => setNewCust({ ...newCust, region: e.target.value })}>
                {REGIONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" value={newCust.email}
                onChange={(e) => setNewCust({ ...newCust, email: e.target.value })} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Region determines which technician will be assigned. See the Technician Map for routing rules.
          </p>
        </div>
      )}

      {/* ── Step 2: Asset (shown after customer selected) ── */}
      {(selectedCustomer || showNewForm) && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs mr-2">2</span>
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

      {/* ── Step 3: Case details ── */}
      {(selectedCustomer || showNewForm) && (
        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="font-semibold text-gray-800">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs mr-2">3</span>
            Case Details
          </h2>

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

          <button type="submit" className="btn-primary w-full py-3 text-base" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Case & Auto-Route →'}
          </button>
        </form>
      )}
    </div>
  )
}
