import React, { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'
import { REGION_ROUTING } from '../data/seed.js'

export default function TechnicianTablePage() {
  const { state, dispatch } = useApp()
  const technicians = state.technicians

  // Track which technician's chat ID is being edited
  const [editing, setEditing] = useState({}) // { [techId]: draftValue }

  function casesFor(techId, status) {
    return state.cases.filter(
      (c) => c.assignedTechnicianId === techId && (status ? c.status === status : true)
    ).length
  }

  function avgFeedback(techId) {
    const rated = state.cases.filter(
      (c) => c.assignedTechnicianId === techId && c.feedback != null
    )
    if (!rated.length) return null
    const avg = rated.reduce((sum, c) => sum + c.feedback, 0) / rated.length
    return avg.toFixed(1)
  }

  function startEdit(tech) {
    setEditing((prev) => ({ ...prev, [tech.id]: tech.telegramChatId || '' }))
  }

  function saveEdit(techId) {
    dispatch({ type: 'UPDATE_TECHNICIAN', payload: { id: techId, telegramChatId: editing[techId] } })
    setEditing((prev) => { const n = { ...prev }; delete n[techId]; return n })
  }

  function cancelEdit(techId) {
    setEditing((prev) => { const n = { ...prev }; delete n[techId]; return n })
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Technician Region Map</h1>
        <p className="text-sm text-gray-500 mt-1">
          Cases are automatically routed based on the customer's region. Edit{' '}
          <code className="bg-gray-100 px-1 rounded text-xs">src/data/seed.js</code> to change assignments.
        </p>
      </div>

      {/* Demo setup notice */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
        <p className="font-semibold mb-1">Demo Setup — Telegram Chat IDs</p>
        <p>
          Enter each technician's Telegram Chat ID below so they receive case assignment notifications.
          To find a Chat ID: open Telegram and message{' '}
          <span className="font-mono bg-blue-100 px-1 rounded">@userinfobot</span> — it replies with your numeric ID.
        </p>
      </div>

      {/* Technician cards — mobile */}
      <div className="sm:hidden space-y-4">
        {technicians.map((tech) => {
          const open   = casesFor(tech.id, 'open')
          const closed = casesFor(tech.id, 'closed')
          const rating = avgFeedback(tech.id)
          const isEditing = tech.id in editing
          return (
            <div key={tech.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{tech.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{tech.id}</p>
                </div>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">📍 {tech.region}</span>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Telegram Chat ID</p>
                {isEditing ? (
                  <div className="flex gap-2">
                    <input
                      className="input text-sm py-1 flex-1"
                      placeholder="e.g. 123456789"
                      value={editing[tech.id]}
                      onChange={(e) => setEditing((prev) => ({ ...prev, [tech.id]: e.target.value }))}
                      autoFocus
                    />
                    <button onClick={() => saveEdit(tech.id)} className="btn-primary text-xs py-1 px-2">Save</button>
                    <button onClick={() => cancelEdit(tech.id)} className="btn-secondary text-xs py-1 px-2">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {tech.telegramChatId
                      ? <span className="font-mono text-sm text-green-700 bg-green-50 px-2 py-0.5 rounded">{tech.telegramChatId}</span>
                      : <span className="text-xs text-gray-400 italic">Not set</span>}
                    <button onClick={() => startEdit(tech)} className="text-xs text-blue-500 hover:underline">
                      {tech.telegramChatId ? 'Edit' : 'Add'}
                    </button>
                  </div>
                )}
              </div>
              <div className="flex gap-4 text-sm">
                <div className="text-center">
                  <p className={`font-bold text-lg ${open > 0 ? 'text-green-600' : 'text-gray-400'}`}>{open}</p>
                  <p className="text-xs text-gray-500">Open</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lg text-gray-500">{closed}</p>
                  <p className="text-xs text-gray-500">Closed</p>
                </div>
                {rating && (
                  <div className="text-center">
                    <p className="font-bold text-lg text-gray-800">⭐ {rating}</p>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Main assignment table — desktop */}
      <div className="hidden sm:block card p-0 overflow-hidden">
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <h2 className="font-semibold text-blue-900">Active Assignments</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left">
              <th className="px-6 py-3 font-semibold text-gray-700">Technician</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Region</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Telegram Chat ID</th>
              <th className="px-6 py-3 font-semibold text-gray-700 text-center">Open</th>
              <th className="px-6 py-3 font-semibold text-gray-700 text-center">Closed</th>
              <th className="px-6 py-3 font-semibold text-gray-700 text-center">Avg Rating</th>
            </tr>
          </thead>
          <tbody>
            {technicians.map((tech) => {
              const open   = casesFor(tech.id, 'open')
              const closed = casesFor(tech.id, 'closed')
              const rating = avgFeedback(tech.id)
              const isEditing = tech.id in editing

              return (
                <tr key={tech.id} className="border-b border-gray-100 hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="font-semibold text-gray-900 text-base">{tech.name}</span>
                    <div className="text-xs text-gray-400 font-mono mt-0.5">{tech.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                      📍 {tech.region}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <input
                          className="input text-sm py-1 w-36"
                          placeholder="e.g. 123456789"
                          value={editing[tech.id]}
                          onChange={(e) => setEditing((prev) => ({ ...prev, [tech.id]: e.target.value }))}
                          autoFocus
                        />
                        <button onClick={() => saveEdit(tech.id)} className="btn-primary text-xs py-1 px-2">Save</button>
                        <button onClick={() => cancelEdit(tech.id)} className="btn-secondary text-xs py-1 px-2">Cancel</button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        {tech.telegramChatId ? (
                          <span className="font-mono text-sm text-green-700 bg-green-50 px-2 py-0.5 rounded">
                            {tech.telegramChatId}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Not set</span>
                        )}
                        <button onClick={() => startEdit(tech)} className="text-xs text-blue-500 hover:underline">
                          {tech.telegramChatId ? 'Edit' : 'Add'}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`font-bold text-lg ${open > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                      {open}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-bold text-lg text-gray-500">{closed}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {rating ? (
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-yellow-400">★</span>
                        <span className="font-semibold text-gray-800">{rating}</span>
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs">No data</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Routing rules */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Routing Rules</h2>
        <p className="text-sm text-gray-500 mb-4">
          These rules live in <code className="bg-gray-100 px-1 rounded text-xs">src/utils/routing.js</code> as a
          plain JavaScript object. The routing engine reads the customer's region at case submission time
          and looks it up here — no ML, no external API, just a map.
        </p>
        <div className="bg-gray-900 text-green-300 rounded-lg p-4 font-mono text-sm overflow-x-auto">
          <div className="text-gray-500 mb-2">// REGION_ROUTING — edit src/data/seed.js to change</div>
          <div className="text-yellow-300">{'{'}</div>
          {Object.entries(REGION_ROUTING).map(([region, techId]) => {
            const tech = technicians.find((t) => t.id === techId)
            return (
              <div key={region} className="ml-4">
                <span className="text-green-300">"{region}"</span>
                <span className="text-gray-400">: </span>
                <span className="text-blue-300">"{techId}"</span>
                <span className="text-gray-500">  // → {tech?.name}</span>
                <span className="text-gray-600">,</span>
              </div>
            )
          })}
          <div className="text-yellow-300">{'}'}</div>
        </div>
      </div>

      {/* Feedback summary */}
      {state.cases.some((c) => c.feedback != null) && (
        <div className="card">
          <h2 className="font-semibold text-gray-800 mb-4">Feedback Summary</h2>
          <div className="space-y-3">
            {state.cases
              .filter((c) => c.feedback != null)
              .map((c) => (
                <div key={c.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{c.caseNumber}</div>
                    <div className="text-xs text-gray-500">{c.customerName} · {c.assignedTechnicianName}</div>
                    {c.feedbackComment && (
                      <div className="text-xs text-gray-600 italic mt-1">"{c.feedbackComment}"</div>
                    )}
                  </div>
                  <div className="text-yellow-400 text-lg leading-none whitespace-nowrap">
                    {'★'.repeat(c.feedback)}<span className="text-gray-200">{'★'.repeat(5 - c.feedback)}</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
