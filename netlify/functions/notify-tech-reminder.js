// ================================================================
// Notify technician that the customer has acknowledged the case.
// Sends a reminder with a direct deep-link to open and complete the case.
// ================================================================

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return { statusCode: 200, body: JSON.stringify({ sent: false, reason: 'TELEGRAM_BOT_TOKEN not set' }) }
  }

  const { techChatId, technicianName, caseNumber, caseId, customerName, siteUrl } =
    JSON.parse(event.body || '{}')

  if (!techChatId) {
    return { statusCode: 200, body: JSON.stringify({ sent: false, reason: 'No Telegram Chat ID for technician.' }) }
  }

  const caseUrl = siteUrl ? `${siteUrl}/cases/${caseId}` : null
  const now = new Date()
  const dateStr = now.toLocaleDateString('en-ZA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const text = [
    `✅ *Customer Has Acknowledged — Action Required*`,
    ``,
    `📋 Case: \`${caseNumber}\``,
    `👤 Customer: *${customerName}*`,
    ``,
    `The customer has confirmed receipt of your assignment.`,
    ``,
    `📅 *Reminder:* ${dateStr}`,
    ``,
    `Please tap the button below to open the case, log your work, and mark it as complete once done.`,
  ].join('\n')

  const body = {
    chat_id: techChatId,
    text,
    parse_mode: 'Markdown',
  }

  if (caseUrl) {
    body.reply_markup = {
      inline_keyboard: [[
        { text: '🔗  Open Case & Complete', url: caseUrl },
      ]],
    }
  }

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await response.json()
  return { statusCode: 200, body: JSON.stringify({ sent: data.ok === true, telegram: data }) }
}
