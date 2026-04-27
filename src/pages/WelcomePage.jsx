import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../context/AppContext.jsx'
import { QRCodeSVG } from 'qrcode.react'

const APP_URL = 'https://chasingjarvis-5.netlify.app/'

function Section({ icon, title, children }) {
  return (
    <div className="flex gap-4">
      <div className="text-2xl flex-shrink-0 mt-0.5">{icon}</div>
      <div>
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <div className="text-sm text-gray-600 space-y-1">{children}</div>
      </div>
    </div>
  )
}

function Step({ n, text }) {
  return (
    <div className="flex items-start gap-3">
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex-shrink-0 mt-0.5">
        {n}
      </span>
      <p className="text-sm text-gray-700">{text}</p>
    </div>
  )
}

export default function WelcomePage() {
  const { state, dispatch } = useApp()
  const [draftId, setDraftId] = useState(state.demoChatId || '')
  const [saved, setSaved]     = useState(false)

  function applyDemoId() {
    if (!draftId.trim()) return
    dispatch({ type: 'SET_DEMO_CHAT_ID', payload: draftId.trim() })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">

      {/* Hero */}
      <div className="card text-center py-8 sm:py-10 bg-gradient-to-br from-blue-50 to-white border border-blue-100">
        <div className="text-5xl mb-4">⚡</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">CaseRouter</h1>
        <p className="text-blue-700 font-semibold text-lg mb-1">Intelligent Field Service Routing Demo</p>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          An MBA capstone project demonstrating how AI-style agent routing, Telegram notifications,
          and customer feedback loops can be combined in a lightweight field service platform.
        </p>
        <Link to="/log" className="btn-primary mt-6 inline-block px-8 py-3 text-base">
          Get Started →
        </Link>
      </div>

      {/* ── DEMO QUICK SETUP — most prominent ── */}
      <div className="card border-2 border-blue-400 bg-blue-50 space-y-4">
        <div>
          <h2 className="font-bold text-blue-900 text-lg">🚀 Demo Quick Setup — Your Telegram ID</h2>
          <p className="text-sm text-blue-800 mt-1">
            Enter your personal Telegram Chat ID once here and it will be applied to
            <strong> all technicians and customers</strong> automatically — so every notification
            goes to <em>your</em> phone during the demo.
          </p>
        </div>

        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="label text-blue-900">Your Telegram Chat ID</label>
            <input
              className="input bg-white"
              placeholder="e.g. 123456789"
              value={draftId}
              onChange={(e) => { setDraftId(e.target.value); setSaved(false) }}
              onKeyDown={(e) => e.key === 'Enter' && applyDemoId()}
            />
          </div>
          <button
            onClick={applyDemoId}
            disabled={!draftId.trim()}
            className="btn-primary px-5 py-2 whitespace-nowrap"
          >
            {saved ? '✓ Applied!' : 'Apply to All'}
          </button>
        </div>

        {state.demoChatId && (
          <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            ✓ Demo Chat ID set: <span className="font-mono font-bold">{state.demoChatId}</span> — all notifications go to this ID.
            You can still override individual technicians on the Technician Map page.
          </p>
        )}

        <div className="p-3 bg-white border border-blue-200 rounded-lg text-sm text-blue-800 space-y-1">
          <p className="font-semibold">How to find your Chat ID:</p>
          <ol className="list-decimal list-inside space-y-0.5 text-blue-700">
            <li>Open Telegram and search for <span className="font-mono bg-blue-50 px-1 rounded">@userinfobot</span></li>
            <li>Send any message (e.g. "hi")</li>
            <li>The bot replies with your numeric ID — paste it above</li>
            <li>Also message the CaseRouter bot directly so it can message you back</li>
          </ol>
        </div>
      </div>

      {/* Demo disclaimer */}
      <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-xl">
        <p className="font-bold text-amber-900">📌 This is a Demo / Prototype</p>
        <ul className="text-sm text-amber-800 mt-2 space-y-1 list-disc list-inside">
          <li>All data lives in your browser's <strong>localStorage</strong> — no backend database.</li>
          <li>Data persists between page refreshes. Use <strong>Reset Demo</strong> (top nav) to wipe it.</li>
          <li>This prototype <strong>can be extended into a production app</strong> with a real database, authentication, and full two-way Telegram webhook integration.</li>
          <li>Built for <strong>project demonstration purposes only</strong>.</li>
        </ul>
      </div>

      {/* What this app does */}
      <div className="card space-y-5">
        <h2 className="font-bold text-gray-900 text-lg">What This App Does</h2>
        <Section icon="📋" title="Case Logging">
          <p>Log a service case, select the customer, attach photos, and describe the issue. A contact name captures who logged the call.</p>
        </Section>
        <Section icon="🤖" title="Automatic Routing">
          <p>The system instantly assigns the correct field technician based on the customer's region — no manual dispatch. This is the "agent-like" intelligence at the heart of the demo.</p>
        </Section>
        <Section icon="📱" title="Telegram Notifications (4 touchpoints)">
          <ol className="list-decimal list-inside mt-1 space-y-0.5">
            <li>Technician notified of new assignment</li>
            <li>Customer notified when technician confirms</li>
            <li>Customer notified when case is closed</li>
            <li>Feedback request sent to customer</li>
          </ol>
        </Section>
        <Section icon="⭐" title="Feedback Loop">
          <p>Customer submits a 1–5 star rating. Results feed into the Feedback dashboard visible to managers.</p>
        </Section>
      </div>

      {/* Tester walkthrough */}
      <div className="card border-green-200 border space-y-4">
        <h2 className="font-bold text-gray-900 text-lg">🧪 Demo Walkthrough — Step by Step</h2>
        <div className="space-y-3">
          <Step n="1" text='Enter your Telegram Chat ID in the Quick Setup box above and click "Apply to All".' />
          <Step n="2" text='Go to Log Case — select a customer (or create one). Set their contact to Telegram — your ID is pre-filled.' />
          <Step n="3" text='Fill in the case description and priority. Attach photos if you like. Click Submit.' />
          <Step n="4" text='Watch your Telegram — you receive the technician assignment notification immediately.' />
          <Step n="5" text='Open the case from Case List → click "Confirm Case & Notify Customer". You get a second Telegram message.' />
          <Step n="6" text='Click "Close Case". You get a closure message + feedback request on Telegram.' />
          <Step n="7" text='Submit a star rating on the web app. Check the Feedback page to see the result.' />
          <Step n="8" text='Use Reset Demo in the top nav to clear everything and start fresh for the next audience.' />
        </div>
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          <strong>Tip:</strong> For a live audience, use your own phone as the "technician" and a colleague's phone (or second device) as the "customer" — enter both Chat IDs in their respective fields.
        </div>
      </div>

      {/* QR Code — share with audience */}
      <div className="card text-center space-y-4">
        <h2 className="font-bold text-gray-900 text-lg">📲 Share This App</h2>
        <p className="text-sm text-gray-500">
          Scan the QR code to open the app on your phone, or share the link with your group.
        </p>
        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-xl border-2 border-gray-200 inline-block">
            <QRCodeSVG
              value={APP_URL}
              size={200}
              bgColor="#ffffff"
              fgColor="#1e3a5f"
              level="H"
              includeMargin={false}
            />
          </div>
        </div>
        <p className="text-sm font-mono text-blue-700 break-all">{APP_URL}</p>
        <button
          onClick={() => navigator.clipboard?.writeText(APP_URL).then(() => window.alert('Link copied!'))}
          className="btn-secondary text-sm"
        >
          Copy Link
        </button>
      </div>

      {/* CTA */}
      <div className="text-center pb-4">
        <Link to="/log" className="btn-primary px-10 py-3 text-base">
          Start Demo — Log a Case →
        </Link>
      </div>

    </div>
  )
}
