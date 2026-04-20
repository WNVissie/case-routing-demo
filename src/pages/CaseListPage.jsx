import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'

function priorityBadge(p) {
  const map = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' }
  return <span className={map[p] || 'badge bg-gray-100 text-gray-600'}>{p}</span>
}

export default function CaseListPage() {
  const { state } = useApp()
  const [filter, setFilter] = useState('all')

  const cases = state.cases.filter((c) =>
    filter === 'all' ? true : c.status === filter
  )

  const openCount   = state.cases.filter((c) => c.status === 'open').length
  const closedCount = state.cases.filter((c) => c.status === 'closed').length

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Case List</h1>
          <p className="text-sm text-gray-500 mt-1">All submitted cases with routing decisions.</p>
        </div>
        <Link to="/" className="btn-primary">+ Log New Case</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total',  value: state.cases.length, color: 'text-gray-800' },
          { label: 'Open',   value: openCount,           color: 'text-green-700' },
          { label: 'Closed', value: closedCount,         color: 'text-gray-500'  },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center py-4">
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-sm text-gray-500 mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'open', 'closed'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      {cases.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📋</div>
          <p className="font-medium">No cases yet.</p>
          <Link to="/" className="btn-primary mt-4 inline-flex">Log the first case →</Link>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-700">Case #</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Customer</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Region</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Technician</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Priority</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-700">Feedback</th>
                  <th className="px-4 py-3 font-semibold text-gray-700"></th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-blue-50/40 transition-colors">
                    <td className="px-4 py-3 font-mono text-blue-700 font-medium">{c.caseNumber}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{c.customerName}</div>
                      <div className="text-xs text-gray-400">{c.customerNumber}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{c.region}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{c.assignedTechnicianName}</td>
                    <td className="px-4 py-3">{priorityBadge(c.priority)}</td>
                    <td className="px-4 py-3">
                      <span className={c.status === 'open' ? 'badge-open' : 'badge-closed'}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {c.feedback
                        ? <span className="text-yellow-500">{'★'.repeat(c.feedback)}{'☆'.repeat(5 - c.feedback)}</span>
                        : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/cases/${c.id}`} className="btn-secondary text-xs py-1 px-3">
                        View
                      </Link>
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
