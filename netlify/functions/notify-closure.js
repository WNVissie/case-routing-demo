// ================================================================
// NETLIFY FUNCTION: notify-closure
//
// Called by the frontend when a case is closed by a technician.
// Sends TWO Telegram messages to the customer:
//   1. Closure confirmation
//   2. Feedback request (1–5 rating)
//
// Required env vars:
//   TELEGRAM_BOT_TOKEN
//   TELEGRAM_CUST_C0001_CHAT_ID  (one per seeded customer)
//   TELEGRAM_CUST_C0002_CHAT_ID
//   … etc.
//
// In a real system, the chat ID would be fetched from a database
// using the customer number. Here we use env vars for the demo.
// ================================================================

// Map customer numbers to their env var keys.
const CUSTOMER_CHAT_ID_MAP = {
  'C-0001': process.env.TELEGRAM_CUST_C0001_CHAT_ID,
  'C-0002': process.env.TELEGRAM_CUST_C0002_CHAT_ID,
  'C-0003': process.env.TELEGRAM_CUST_C0003_CHAT_ID,
  'C-0004': process.env.TELEGRAM_CUST_C0004_CHAT_ID,
  'C-0005': process.env.TELEGRAM_CUST_C0005_CHAT_ID,
}

async function sendMessage(token, chatId, text) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
  })
  return res.json()
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

  const { customerNumber, customerName, caseNumber, closureNote } =
    JSON.parse(event.body || '{}')

  const chatId = CUSTOMER_CHAT_ID_MAP[customerNumber]
  if (!chatId) {
    return {
      statusCode: 200,
      body: JSON.stringify({ sent: false, reason: `No chat ID configured for customer ${customerNumber}` }),
    }
  }

  // Message 1 — Closure confirmation
  const closureText = [
    `✅ *Your Case Has Been Resolved*`,
    ``,
    `📋 Case: \`${caseNumber}\``,
    `Dear ${customerName},`,
    ``,
    `We are pleased to inform you that your service case has been closed.`,
    closureNote ? `\n📝 *Technician's note:* ${closureNote}` : '',
    ``,
    `Thank you for your patience.`,
  ].filter(Boolean).join('\n')

  await sendMessage(token, chatId, closureText)

  // Message 2 — Feedback request
  // In a production system you would set up a Telegram webhook to
  // receive the customer's reply and write it back to the database.
  // For this demo, feedback is collected via the web app.
  const feedbackText = [
    `📋 *Quick Feedback Request*`,
    ``,
    `How would you rate the service for case \`${caseNumber}\`?`,
    ``,
    `1️⃣ Poor  2️⃣ Fair  3️⃣ Good  4️⃣ Very Good  5️⃣ Excellent`,
    ``,
    `_You can also submit your rating directly on the service portal._`,
  ].join('\n')

  const fbResult = await sendMessage(token, chatId, feedbackText)

  return {
    statusCode: 200,
    body: JSON.stringify({ sent: fbResult.ok === true }),
  }
}
