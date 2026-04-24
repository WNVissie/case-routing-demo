// ================================================================
// Notify customer that their technician has accepted the case.
// Includes an "Acknowledge" button that deep-links to the case.
// ================================================================

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return { statusCode: 200, body: JSON.stringify({ sent: false, reason: 'TELEGRAM_BOT_TOKEN not set' }) }
  }

  const { customerChatId, customerName, caseNumber, caseId, technicianName, siteUrl } =
    JSON.parse(event.body || '{}')

  if (!customerChatId) {
    return { statusCode: 200, body: JSON.stringify({ sent: false, reason: 'No Telegram Chat ID for this customer.' }) }
  }

  const caseUrl = siteUrl ? `${siteUrl}/cases/${caseId}` : null

  const text = [
    `🛠️ *Technician Assigned & Confirmed*`,
    ``,
    `📋 Case: \`${caseNumber}\``,
    `Dear *${customerName}*,`,
    ``,
    `Great news! *${technicianName}* has accepted your service case and will be attending to it shortly.`,
    ``,
    `Please tap the button below to acknowledge receipt of this notification.`,
    ``,
    `_Thank you for your patience._`,
  ].join('\n')

  const body = {
    chat_id: customerChatId,
    text,
    parse_mode: 'Markdown',
  }

  if (caseUrl) {
    body.reply_markup = {
      inline_keyboard: [[
        { text: '✅  Acknowledge', url: caseUrl },
        { text: '📋  View Case Status', url: caseUrl },
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
