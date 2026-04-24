// ================================================================
// TELEGRAM API HELPERS
// All functions post to Netlify Functions (/api/*).
// siteUrl (window.location.origin) is passed in every payload so
// Netlify functions can build deep-link buttons back to the app.
// ================================================================

const BASE = '/api'

async function post(path, payload) {
  try {
    const res = await fetch(`${BASE}/${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ siteUrl: window.location.origin, ...payload }),
    })
    const data = await res.json()
    return data.sent === true
  } catch {
    return false
  }
}

/** New case created → notify assigned technician with Accept button. */
export const notifyAssignment    = (p) => post('notify-assignment',    p)

/** Technician accepted → notify customer with Acknowledge button. */
export const notifyConfirmation  = (p) => post('notify-confirmation',  p)

/** Customer acknowledged → notify technician with case deep-link. */
export const notifyTechReminder  = (p) => post('notify-tech-reminder', p)

/** Case closed → notify customer with closure note + star rating buttons. */
export const notifyClosure       = (p) => post('notify-closure',       p)
