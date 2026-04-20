// ================================================================
// TELEGRAM API HELPERS
//
// These call Netlify Functions (/api/*) which hold the secret bot
// token. The frontend never touches the token directly.
//
// If the Netlify function returns { sent: false }, it means the
// Telegram Chat ID env var is not configured — the app degrades
// gracefully and simply skips the notification.
// ================================================================

const BASE = '/api'

/**
 * Notify the assigned technician when a new case is created.
 * @param {object} payload
 * @returns {Promise<boolean>} true if message was sent
 */
export async function notifyAssignment(payload) {
  try {
    const res = await fetch(`${BASE}/notify-assignment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    return data.sent === true
  } catch {
    return false
  }
}

/**
 * Notify the customer when their case is closed and request feedback.
 * @param {object} payload
 * @returns {Promise<boolean>} true if message was sent
 */
export async function notifyClosure(payload) {
  try {
    const res = await fetch(`${BASE}/notify-closure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()
    return data.sent === true
  } catch {
    return false
  }
}
