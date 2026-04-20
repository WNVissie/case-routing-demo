import React, { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { notifyClosure } from '../utils/telegram.js'

// ── Star rating input ────────────────────────────────────────

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className={`text-3xl transition-colors leading-none ${
            n <= (hovered || value) ? 'text-yellow-400' : 'text-gray-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  )
}

// ── Field display helper ─────────────────────────────────────

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || '—'}</dd>
    </div>
  )
}

// ── Main ─────────────────────────────────────────────────────

export default function CaseDetailPage() {
  const { id }           = useParams()
  const { state, dispatch } = useApp()
  const navigate         = useNavigate()

  const caseData = state.cases.find((c) => c.id === id)

  const [closureNote, setClosureNote]   = useState('')
  const [closing, setClosing]           = useState(false)
  const [feedbackScore, setFeedbackScore] = useState(0)
  const [feedbackComment, setFeedbackComment] = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)

  if (!caseData) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-xl mb-4">Case not found.</p>
        <Link to="/cases" className="btn-primary">← Back to Case List</Link>
      </div>
    )
  }

  // ── close case ──
  async function handleClose(e) {
    e.preventDefault()
    setClosing(true)

    dispatch({ type: 'CLOSE_CASE', payload: { id: caseData.id, closureNote } })

    // ── TELEGRAM: notify customer of closure + request feedback ──
    // In a real app, customerNumber maps to a stored chatId.
    // Here the Netlify function resolves the chatId from env vars.
    const sent = await notifyClosure({
      customerNumber: caseData.customerNumber,
      customerName:   caseData.customerName,
      caseNumber:     caseData.caseNumber,
      closureNote,
    })
    // ──────────────────────────────────────────────────────────

    setClosing(false)

    // Show a brief success message via alert so we don't need extra state
    if (sent) {
      window.alert(`Case closed. Telegram closure + feedback request sent to ${caseData.customerName}.`)
    } else {
      window.alert('Case closed. (Telegram not configured — notification skipped.)')
    }
  }

  // ── feedback ──
  function handleFeedback(e) {
    e.preventDefault()
    if (!feedbackScore) return
    setSubmittingFeedback(true)
    dispatch({
      type: 'ADD_FEEDBACK',
      payload: { id: caseData.id, score: feedbackScore, comment: feedbackComment },
    })
    setSubmittingFeedback(false)
  }

  const priorityColor = {
    high: 'text-red-700 bg-red-50', medium: 'text-yellow-700 bg-yellow-50', low: 'text-blue-700 bg-blue-50',
  }[caseData.priority] || ''

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/cases" className="btn-secondary text-xs mt-1">← Cases</Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold font-mono text-blue-700">{caseData.caseNumber}</h1>
            <span className={caseData.status === 'open' ? 'badge-open' : 'badge-closed'}>
              {caseData.status}
            </span>
            <span className={`badge ${priorityColor}`}>{caseData.priority} priority</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Created {new Date(caseData.createdAt).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Customer + asset */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Customer</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Name"            value={caseData.customerName} />
          <Field label="Customer #"      value={caseData.customerNumber} />
          <Field label="Region"          value={caseData.region} />
          {caseData.assetNumber && (
            <>
              <Field label="Asset #"      value={caseData.assetNumber} />
              <Field label="Asset"        value={caseData.assetDescription} />
            </>
          )}
        </dl>
      </div>

      {/* Case description */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-2">Description</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{caseData.description}</p>
      </div>

      {/* ── ROUTING DECISION BOX ── */}
      {/* This box makes the "agent-like" logic visible to the audience. */}
      <div className="card bg-blue-50 border-blue-200 border-2">
        <h2 className="font-semibold text-blue-900 mb-1">🤖 Routing Decision</h2>
        <p className="text-sm text-blue-800">{caseData.routingReason}</p>
        <div className="mt-3 flex items-center gap-3">
          <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">Assigned technician</div>
          <div className="font-bold text-blue-900 text-lg">{caseData.assignedTechnicianName}</div>
        </div>
        {caseData.telegramSent
          ? <p className="text-xs text-green-700 mt-2">📱 Telegram notification was sent to technician</p>
          : <p className="text-xs text-gray-400 mt-2">📵 Telegram not configured — notification skipped</p>}
      </div>

      {/* ── Close case form (only when open) ── */}
      {caseData.status === 'open' && (
        <form onSubmit={handleClose} className="card space-y-4 border-orange-200 border">
          <h2 className="font-semibold text-gray-800">Close This Case</h2>
          <div>
            <label className="label">Resolution / Closure Note</label>
            <textarea
              className="input min-h-[80px] resize-y"
              placeholder="What was done to resolve this issue?"
              value={closureNote}
              onChange={(e) => setClosureNote(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-success w-full" disabled={closing}>
            {closing ? 'Closing…' : '✓ Close Case & Notify Customer'}
          </button>
          <p className="text-xs text-gray-400 text-center">
            Closing will send a Telegram message to the customer and request feedback.
          </p>
        </form>
      )}

      {/* ── Closed info ── */}
      {caseData.status === 'closed' && (
        <div className="card bg-gray-50">
          <h2 className="font-semibold text-gray-700 mb-3">Closure Details</h2>
          <dl className="space-y-2">
            <Field label="Closed at"     value={new Date(caseData.closedAt).toLocaleString()} />
            <Field label="Closure note"  value={caseData.closureNote} />
          </dl>
        </div>
      )}

      {/* ── Feedback section ── */}
      {caseData.status === 'closed' && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Customer Feedback</h2>

          {caseData.feedback ? (
            // Feedback already submitted — display it
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-yellow-400 text-3xl leading-none">
                  {'★'.repeat(caseData.feedback)}
                  <span className="text-gray-200">{'★'.repeat(5 - caseData.feedback)}</span>
                </span>
                <span className="font-bold text-2xl text-gray-800">{caseData.feedback} / 5</span>
              </div>
              {caseData.feedbackComment && (
                <p className="text-sm text-gray-600 italic bg-gray-50 rounded-lg p-3">
                  "{caseData.feedbackComment}"
                </p>
              )}
            </div>
          ) : (
            // Collect feedback from the web app (simulates customer responding)
            <form onSubmit={handleFeedback} className="space-y-4">
              <p className="text-sm text-gray-500">
                In a live setup the customer rates via Telegram. For the demo, submit feedback here:
              </p>
              <div>
                <label className="label">Rating *</label>
                <StarInput value={feedbackScore} onChange={setFeedbackScore} />
                {feedbackScore > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][feedbackScore]}
                  </p>
                )}
              </div>
              <div>
                <label className="label">Comment <span className="text-gray-400">(optional)</span></label>
                <textarea
                  className="input"
                  placeholder="Any additional comments…"
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={!feedbackScore || submittingFeedback}
              >
                Submit Feedback
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
