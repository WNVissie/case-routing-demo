// ================================================================
// NETLIFY FUNCTION: notify-assignment
//
// Called by the frontend when a new case is submitted.
// Sends a Telegram message to the assigned technician.
//
// Required env vars (set in Netlify → Site → Environment):
//   TELEGRAM_BOT_TOKEN
//   TELEGRAM_JONATHAN_CHAT_ID
//   TELEGRAM_PETER_CHAT_ID
//   TELEGRAM_PORTIA_CHAT_ID
// ================================================================

// Map technician IDs to their env var keys.
// This stays server-side so chat IDs are never in the frontend bundle.
const TECH_CHAT_ID_MAP = {
  'TECH-001': process.env.TELEGRAM_JONATHAN_CHAT_ID,
  'TECH-002': process.env.TELEGRAM_PETER_CHAT_ID,
  'TECH-003': process.env.TELEGRAM_PORTIA_CHAT_ID,
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return {
      statusCode: 200,
      body: JSON.stringify({ sent: false, reason: 'TELEGRAM_BOT_TOKEN not set' }),
    }
  }

  const { technicianId, technicianName, caseNumber, customerName, region, description, priority } =
    JSON.parse(event.body || '{}')

  const chatId = TECH_CHAT_ID_MAP[technicianId]
  if (!chatId) {
    return {
      statusCode: 200,
      body: JSON.stringify({ sent: false, reason: `No chat ID configured for ${technicianId}` }),
    }
  }

  const priorityEmoji = { high: '🔴', medium: '🟡', low: '🟢' }[priority] || '⚪'

  const text = [
    `🔧 *New Case Assigned to You*`,
    ``,
    `📋 Case: \`${caseNumber}\``,
    `👤 Customer: ${customerName}`,
    `📍 Region: ${region}`,
    `${priorityEmoji} Priority: ${priority}`,
    ``,
    `📝 *Description:*`,
    description,
    ``,
    `_You have been auto-routed this case based on your region assignment._`,
  ].join('\n')

  // Call the Telegram Bot API
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id:    chatId,
      text,
      parse_mode: 'Markdown',
    }),
  })

  const data = await response.json()
  return {
    statusCode: 200,
    body: JSON.stringify({ sent: data.ok === true, telegram: data }),
  }
}
