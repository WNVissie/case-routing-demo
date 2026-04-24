import React, { useState, useEffect } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { notifyConfirmation, notifyTechReminder, notifyClosure } from '../utils/telegram.js'

function StarInput({ value, onChange }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button"
          onMouseEnter={() => setHovered(n)} onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          className={`text-3xl transition-colors leading-none ${n <= (hovered || value) ? 'text-yellow-400' : 'text-gray-300'}`}
        >★</button>
      ))}
    </div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</dt>
      <dd className="mt-1 text-sm text-gray-900">{value || '—'}</dd>
    </div>
  )
}

function TimelineStep({ n, done, label, sub }) {
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
        ${done ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
        {done ? '✓' : n}
      </span>
      <div>
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{sub}</p>
      </div>
    </li>
  )
}

export default function CaseDetailPage() {
  const { id }              = useParams()
  const [searchParams]      = useSearchParams()
  const { state, dispatch } = useApp()

  const caseData = state.cases.find((c) => c.id === id)
  const customer = caseData ? state.customers.find((c) => c.id === caseData.customerId) : null
  const technician = caseData ? state.technicians.find((t) => t.id === caseData.assignedTechnicianId) : null

  const [closureNote, setClosureNote]             = useState('')
  const [closing, setClosing]                     = useState(false)
  const [accepting, setAccepting]                 = useState(false)
  const [acknowledging, setAcknowledging]         = useState(false)
  const [feedbackScore, setFeedbackScore]         = useState(0)
  const [feedbackComment, setFeedbackComment]     = useState('')
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const [autoRated, setAutoRated]                 = useState(false)

  // Auto-apply rating when customer taps a star button in Telegram (?rate=N)
  useEffect(() => {
    if (!caseData || autoRated) return
    const rateParam = searchParams.get('rate')
    if (!rateParam) return
    const score = parseInt(rateParam, 10)
    if (score >= 1 && score <= 5 && caseData.status === 'closed' && caseData.feedback == null) {
      dispatch({ type: 'ADD_FEEDBACK', payload: { id: caseData.id, score, comment: '' } })
      setAutoRated(true)
    }
  }, [caseData?.id, searchParams])

  if (!caseData) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p className="text-xl mb-4">Case not found.</p>
        <Link to="/cases" className="btn-primary">← Back to Case List</Link>
      </div>
    )
  }

  const customerChatId = customer?.telegramChatId || state.demoChatId || ''
  const techChatId     = technician?.telegramChatId || state.demoChatId || ''

  // ── Step 1: Technician accepts case → customer notified ──
  async function handleAccept() {
    setAccepting(true)
    dispatch({ type: 'CONFIRM_CASE', payload: { id: caseData.id } })
    const sent = await notifyConfirmation({
      customerChatId,
      customerName:   caseData.customerName,
      caseNumber:     caseData.caseNumber,
      caseId:         caseData.id,
      technicianName: caseData.assignedTechnicianName,
    })
    setAccepting(false)
    window.alert(sent
      ? `✅ Accepted. Customer "${caseData.customerName}" notified via Telegram.`
      : '✅ Accepted. (No Telegram Chat ID for customer — notification skipped.)')
  }

  // ── Step 2: Customer acknowledges → technician reminded with case link ──
  async function handleAcknowledge() {
    setAcknowledging(true)
    dispatch({ type: 'CUSTOMER_ACKNOWLEDGE', payload: { id: caseData.id } })
    const sent = await notifyTechReminder({
      techChatId,
      technicianName: caseData.assignedTechnicianName,
      caseNumber:     caseData.caseNumber,
      caseId:         caseData.id,
      customerName:   caseData.customerName,
    })
    setAcknowledging(false)
    window.alert(sent
      ? `✅ Acknowledged. Technician "${caseData.assignedTechnicianName}" sent a reminder with a link to this case.`
      : '✅ Acknowledged. (No Telegram Chat ID for technician — notification skipped.)')
  }

  // ── Step 3: Technician closes case → customer notified with rating buttons ──
  async function handleClose(e) {
    e.preventDefault()
    setClosing(true)
    dispatch({ type: 'CLOSE_CASE', payload: { id: caseData.id, closureNote } })
    const sent = await notifyClosure({
      customerChatId,
      customerName:   caseData.customerName,
      caseNumber:     caseData.caseNumber,
      caseId:         caseData.id,
      closureNote,
      technicianName: caseData.assignedTechnicianName,
    })
    setClosing(false)
    window.alert(sent
      ? `✅ Case closed. Customer notified via Telegram with a feedback rating request.`
      : '✅ Case closed. (No Telegram Chat ID for customer — notification skipped.)')
  }

  // ── Manual feedback (fallback if no Telegram) ──
  function handleFeedback(e) {
    e.preventDefault()
    if (!feedbackScore) return
    setSubmittingFeedback(true)
    dispatch({ type: 'ADD_FEEDBACK', payload: { id: caseData.id, score: feedbackScore, comment: feedbackComment } })
    setSubmittingFeedback(false)
  }

  const priorityColor = {
    high: 'text-red-700 bg-red-50', medium: 'text-yellow-700 bg-yellow-50', low: 'text-blue-700 bg-blue-50',
  }[caseData.priority] || ''

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Auto-rated banner */}
      {autoRated && (
        <div className="p-4 bg-green-50 border-2 border-green-400 rounded-xl text-center">
          <p className="text-green-800 font-semibold text-lg">⭐ Thank you for your feedback!</p>
          <p className="text-green-700 text-sm mt-1">Your rating has been recorded.</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/cases" className="btn-secondary text-xs mt-1">← Cases</Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold font-mono text-blue-700">{caseData.caseNumber}</h1>
            <span className={caseData.status === 'open' ? 'badge-open' : 'badge-closed'}>{caseData.status}</span>
            <span className={`badge ${priorityColor}`}>{caseData.priority}</span>
            {caseData.confirmed && <span className="badge bg-green-100 text-green-700">✓ Accepted</span>}
            {caseData.customerAcknowledged && <span className="badge bg-blue-100 text-blue-700">✓ Acknowledged</span>}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Created {new Date(caseData.createdAt).toLocaleString()}
            {caseData.loggedBy && <> · Logged by <strong>{caseData.loggedBy}</strong></>}
          </p>
        </div>
      </div>

      {/* Notification timeline */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Case Progress</h2>
        <ol className="space-y-4">
          <TimelineStep n="1" done={caseData.telegramSent}
            label="Technician notified of new assignment"
            sub={caseData.telegramSent ? 'Telegram sent on case creation' : 'Telegram not configured for technician'} />
          <TimelineStep n="2" done={!!caseData.confirmed}
            label="Technician accepted → customer notified"
            sub={caseData.confirmed ? `Accepted ${new Date(caseData.confirmedAt).toLocaleString()}` : 'Pending — technician must accept below'} />
          <TimelineStep n="3" done={!!caseData.customerAcknowledged}
            label="Customer acknowledged → technician sent case link"
            sub={caseData.customerAcknowledged ? `Acknowledged ${new Date(caseData.customerAcknowledgedAt).toLocaleString()}` : 'Pending — customer must acknowledge below'} />
          <TimelineStep n="4" done={caseData.status === 'closed'}
            label="Technician completed → customer notified + rating requested"
            sub={caseData.status === 'closed' ? `Closed ${new Date(caseData.closedAt).toLocaleString()}` : 'Pending — close the case below'} />
          <TimelineStep n="5" done={caseData.feedback != null}
            label="Customer feedback received"
            sub={caseData.feedback != null ? `Rating: ${'★'.repeat(caseData.feedback)} ${caseData.feedback}/5` : 'Awaiting customer rating'} />
        </ol>
      </div>

      {/* Customer */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Customer</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Field label="Name"             value={caseData.customerName} />
          <Field label="Customer #"       value={caseData.customerNumber} />
          <Field label="Region"           value={caseData.region} />
          <Field label="Email"            value={customer?.email} />
          <Field label="Telegram Chat ID" value={customerChatId || 'Not set'} />
          {caseData.assetNumber && <>
            <Field label="Asset #"  value={caseData.assetNumber} />
            <Field label="Asset"    value={caseData.assetDescription} />
          </>}
        </dl>
      </div>

      {/* Photos */}
      {caseData.photos?.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-3">Photos</h2>
          <div className="flex gap-3 flex-wrap">
            {caseData.photos.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noreferrer">
                <img src={src} alt={`Photo ${i + 1}`}
                  className="w-36 h-36 sm:w-40 sm:h-40 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-2">Issue Description</h2>
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{caseData.description}</p>
      </div>

      {/* Routing */}
      <div className="card bg-blue-50 border-blue-200 border-2">
        <h2 className="font-semibold text-blue-900 mb-1">🤖 Auto-Routing Decision</h2>
        <p className="text-sm text-blue-800">{caseData.routingReason}</p>
        <div className="mt-3 flex items-center gap-3">
          <span className="text-xs text-blue-600 font-medium uppercase tracking-wide">Assigned technician</span>
          <span className="font-bold text-blue-900 text-lg">{caseData.assignedTechnicianName}</span>
        </div>
        <p className={`text-xs mt-2 ${caseData.telegramSent ? 'text-green-700' : 'text-gray-400'}`}>
          {caseData.telegramSent ? '📱 Telegram sent to technician on assignment' : '📵 Telegram not configured — notification skipped'}
        </p>
      </div>

      {/* ── ACTION PANELS (open cases only) ── */}
      {caseData.status === 'open' && (
        <div className="space-y-4">

          {/* Step 1 — Technician accepts */}
          {!caseData.confirmed && (
            <div className="card border-2 border-blue-400 space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold">1</span>
                <h2 className="font-semibold text-gray-900">Technician: Accept This Case</h2>
              </div>
              <p className="text-sm text-gray-600">
                Tap below to confirm you have received this case.
                {customerChatId
                  ? ` The customer "${caseData.customerName}" will be notified via Telegram.`
                  : ' (No customer Telegram ID set — notification will be skipped.)'}
              </p>
              <button onClick={handleAccept} className="btn-primary w-full py-3" disabled={accepting}>
                {accepting ? 'Sending…' : '✅  Accept Case & Notify Customer'}
              </button>
            </div>
          )}

          {/* Step 2 — Customer acknowledges */}
          {caseData.confirmed && !caseData.customerAcknowledged && (
            <div className="card border-2 border-green-400 space-y-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-600 text-white text-sm font-bold">2</span>
                <h2 className="font-semibold text-gray-900">Customer: Acknowledge This Case</h2>
              </div>
              <p className="text-sm text-gray-600">
                Tap below to acknowledge that you have been notified.
                {techChatId
                  ? ` Technician "${caseData.assignedTechnicianName}" will receive a reminder with a link to this case.`
                  : ' (No technician Telegram ID set — reminder will be skipped.)'}
              </p>
              <button onClick={handleAcknowledge} className="btn-success w-full py-3" disabled={acknowledging}>
                {acknowledging ? 'Sending…' : '✅  Acknowledge & Remind Technician'}
              </button>
            </div>
          )}

          {/* Step 3 — Technician closes */}
          <form onSubmit={handleClose} className="card border-2 border-orange-300 space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-500 text-white text-sm font-bold">3</span>
              <h2 className="font-semibold text-gray-900">Technician: Complete & Close Case</h2>
            </div>
            <div>
              <label className="label">Work Completed / Resolution Notes</label>
              <textarea
                className="input min-h-[90px] resize-y"
                placeholder="Describe what was done to resolve the issue…"
                value={closureNote}
                onChange={(e) => setClosureNote(e.target.value)}
              />
            </div>
            <button type="submit" className="btn-success w-full py-3" disabled={closing}>
              {closing ? 'Closing…' : '✓ Mark Complete & Notify Customer'}
            </button>
            <p className="text-xs text-gray-400 text-center">
              Customer will receive a Telegram closure message + star rating buttons (1–5).
            </p>
          </form>
        </div>
      )}

      {/* Closure details */}
      {caseData.status === 'closed' && (
        <div className="card bg-gray-50">
          <h2 className="font-semibold text-gray-700 mb-3">Closure Details</h2>
          <dl className="space-y-2">
            <Field label="Closed at"       value={new Date(caseData.closedAt).toLocaleString()} />
            <Field label="Work completed"  value={caseData.closureNote} />
          </dl>
        </div>
      )}

      {/* Feedback */}
      {caseData.status === 'closed' && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Customer Feedback</h2>
          {caseData.feedback != null ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-yellow-400 text-3xl leading-none">
                  {'★'.repeat(caseData.feedback)}
                  <span className="text-gray-200">{'★'.repeat(5 - caseData.feedback)}</span>
                </span>
                <span className="font-bold text-2xl text-gray-800">{caseData.feedback} / 5</span>
                <span className="text-sm text-gray-500">{['','Poor','Fair','Good','Very Good','Excellent'][caseData.feedback]}</span>
              </div>
              {caseData.feedbackComment && (
                <p className="text-sm text-gray-600 italic bg-gray-50 rounded-lg p-3">"{caseData.feedbackComment}"</p>
              )}
            </div>
          ) : (
            <form onSubmit={handleFeedback} className="space-y-4">
              <p className="text-sm text-gray-500">
                Customer receives star-rating buttons via Telegram. You can also submit manually here:
              </p>
              <div>
                <label className="label">Rating *</label>
                <StarInput value={feedbackScore} onChange={setFeedbackScore} />
                {feedbackScore > 0 && (
                  <p className="text-xs text-gray-500 mt-1">{['','Poor','Fair','Good','Very Good','Excellent'][feedbackScore]}</p>
                )}
              </div>
              <div>
                <label className="label">Comment <span className="text-gray-400">(optional)</span></label>
                <textarea className="input" placeholder="Any additional comments…"
                  value={feedbackComment} onChange={(e) => setFeedbackComment(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary" disabled={!feedbackScore || submittingFeedback}>
                Submit Feedback
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}
