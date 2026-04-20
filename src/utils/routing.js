// ================================================================
// AGENT-LIKE ROUTING LOGIC
//
// routeCase() is the automated dispatcher. It reads the customer's
// region, looks it up in REGION_ROUTING, and returns the matching
// technician together with a human-readable explanation.
//
// In a production system this could call an ML model, a rules
// engine, or an external scheduling service. Here it is a simple
// map lookup — deliberately transparent for the demo.
// ================================================================

import { REGION_ROUTING, technicians } from '../data/seed.js'

/**
 * Given a region string, find the assigned technician.
 * @param {string} region
 * @returns {{ technician: object|null, reason: string }}
 */
export function routeCase(region) {
  const techId = REGION_ROUTING[region]

  if (!techId) {
    return {
      technician: null,
      reason: `No routing rule is defined for region "${region}". Please assign a technician manually.`,
    }
  }

  const technician = technicians.find((t) => t.id === techId)
  return {
    technician,
    reason: `Auto-routed to ${technician.name} — region rule: "${region}" → ${technician.name}.`,
  }
}

/**
 * Generate a case number in the format CASE-YYYYMMDD-NNN.
 * The counter resets each day. Works with an array of existing cases.
 * @param {Array} existingCases
 * @returns {string}
 */
export function generateCaseNumber(existingCases) {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const todayCount = existingCases.filter((c) =>
    c.caseNumber.includes(`CASE-${dateStr}`)
  ).length
  const seq = String(todayCount + 1).padStart(3, '0')
  return `CASE-${dateStr}-${seq}`
}
