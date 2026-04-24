import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

function Stars({ value }) {
  return (
    <span>
      <span className="text-yellow-400">{'★'.repeat(value)}</span>
      <span className="text-gray-200">{'★'.repeat(5 - value)}</span>
    </span>
  )
}

const RATING_LABEL = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent']

export default function FeedbackPage() {
  const { state } = useApp()
  const [filter, setFilter] = useState('all') // all | pending | received

  const allClosed = state.cases.filter((c) => c.status === 'closed')
  const withFeedback    = allClosed.filter((c) => c.feedback != null)
  const pendingFeedback = allClosed.filter((c) => c.feedback == null)

  const avgScore = withFeedback.length
    ? (withFeedback.reduce((s, c) => s + c.feedback, 0) / withFeedback.length).toFixed(1)
    : null

  const displayed = allClosed.filter((c) => {
    if (filter === 'received') return c.feedback != null
    if (filter === 'pending')  return c.feedback == null
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">All feedback submitted for closed cases.</p>
        </div>
        <Link to="/cases" className="btn-secondary text-sm">← Case List</Link>
      </div>

      {/* Demo note */}
      <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-lg text-sm">
        <p className="font-bold text-amber-800">📌 Demo Mode — Admin / Manager View</p>
        <p className="text-amber-700 mt-1">
          In production this screen would be restricted to managers/admins.
          Customers submit feedback via Telegram (by replying to the bot) or on the web portal.
          The rating is then stored against the case automatically.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Closed Cases',     value: allClosed.length,      color: 'text-gray-700' },
          { label: 'Feedback Received', value: withFeedback.length,   color: 'text-green-700' },
          { label: 'Awaiting Feedback', value: pendingFeedback.length, color: 'text-orange-600' },
          { label: 'Average Rating',   value: avgScore ? `${avgScore} / 5` : '—', color: 'text-blue-700' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center py-4">
            <div className={`text-2xl font-bold ${color}`}>{value}</div>
            <div className="text-xs text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all',      label: 'All Closed' },
          { key: 'received', label: 'Feedback Received' },
          { key: 'pending',  label: 'Awaiting Feedback' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filter === key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      {displayed.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📊</div>
          <p className="font-medium">No entries to show.</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-700">Case #</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Customer</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Technician</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Closed</th>
                  <th className="px-4 py-3 font-semibold text-gray-700 text-center">Rating</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Comment</th>
                  <th className="px-4 py-3 font-semibold text-gray-700"></th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-blue-700 font-medium">{c.caseNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{c.customerName}</div>
                      <div className="text-xs text-gray-400">{c.customerNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{c.assignedTechnicianName}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {c.closedAt ? new Date(c.closedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.feedback != null ? (
                        <div>
                          <Stars value={c.feedback} />
                          <div className="text-xs text-gray-500 mt-0.5">{RATING_LABEL[c.feedback]}</div>
                        </div>
                      ) : (
                        <span className="inline-block text-xs text-orange-600 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 italic max-w-xs">
                      {c.feedbackComment ? `"${c.feedbackComment}"` : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/cases/${c.id}`} className="btn-secondary text-xs py-1 px-3">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
