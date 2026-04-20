import React from 'react'
import { useApp } from '../context/AppContext.jsx'
import { technicians, REGION_ROUTING } from '../data/seed.js'

export default function TechnicianTablePage() {
  const { state } = useApp()

  // Count cases per technician
  function casesFor(techId, status) {
    return state.cases.filter(
      (c) => c.assignedTechnicianId === techId && (status ? c.status === status : true)
    ).length
  }

  // Average feedback score for closed cases with feedback
  function avgFeedback(techId) {
    const rated = state.cases.filter(
      (c) => c.assignedTechnicianId === techId && c.feedback != null
    )
    if (!rated.length) return null
    const avg = rated.reduce((sum, c) => sum + c.feedback, 0) / rated.length
    return avg.toFixed(1)
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

      {/* Main assignment table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <h2 className="font-semibold text-blue-900">Active Assignments</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 text-left">
              <th className="px-6 py-3 font-semibold text-gray-700">Technician</th>
              <th className="px-6 py-3 font-semibold text-gray-700">Assigned Region</th>
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

      {/* Routing rules — displayed as a readable reference */}
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
