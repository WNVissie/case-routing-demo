// ================================================================
// Notify customer when their case is closed.
// Sends a closure message then a rating request with 5 inline
// URL buttons — each deep-links to /cases/:id?rate=N so the
// rating is applied automatically when the customer taps the button.
// ================================================================

async function sendMessage(token, chatId, text, replyMarkup) {
  const body = { chat_id: chatId, text, parse_mode: 'Markdown' }
  if (replyMarkup) body.reply_markup = replyMarkup
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' }

  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    return { statusCode: 200, body: JSON.stringify({ sent: false, reason: 'TELEGRAM_BOT_TOKEN not set' }) }
  }

  const { customerChatId, customerName, caseNumber, caseId, closureNote, technicianName, siteUrl } =
    JSON.parse(event.body || '{}')

  if (!customerChatId) {
    return { statusCode: 200, body: JSON.stringify({ sent: false, reason: 'No Telegram Chat ID for customer.' }) }
  }

  // Message 1 — closure confirmation
  const closureText = [
    `✅ *Your Case Has Been Resolved*`,
    ``,
    `📋 Case: \`${caseNumber}\``,
    `Dear *${customerName}*,`,
    ``,
    `*${technicianName || 'Your technician'}* has completed your service case.`,
    closureNote ? `\n📝 *Work completed:*\n${closureNote}` : '',
    ``,
    `Thank you for your patience. We hope the issue has been fully resolved.`,
  ].filter(Boolean).join('\n')

  await sendMessage(token, customerChatId, closureText)

  // Message 2 — rating request with inline URL buttons
  const caseUrl = siteUrl ? `${siteUrl}/cases/${caseId}` : null

  const ratingText = [
    `⭐ *Please Rate Our Service*`,
    ``,
    `Case: \`${caseNumber}\``,
    ``,
    `How would you rate the service you received?`,
    `Tap a star below — it takes you directly to the app and records your rating automatically.`,
  ].join('\n')

  let ratingMarkup = null
  if (caseUrl) {
    ratingMarkup = {
      inline_keyboard: [[
        { text: '⭐ 1',     url: `${caseUrl}?rate=1` },
        { text: '⭐⭐ 2',   url: `${caseUrl}?rate=2` },
        { text: '⭐⭐⭐ 3', url: `${caseUrl}?rate=3` },
      ], [
        { text: '⭐⭐⭐⭐ 4',   url: `${caseUrl}?rate=4` },
        { text: '⭐⭐⭐⭐⭐ 5', url: `${caseUrl}?rate=5` },
      ]],
    }
  }

  const result = await sendMessage(token, customerChatId, ratingText, ratingMarkup)

  return { statusCode: 200, body: JSON.stringify({ sent: result.ok === true }) }
}
