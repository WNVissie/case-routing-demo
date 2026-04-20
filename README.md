# CaseRouter — MBA Field Service Routing Demo

A lightweight proof-of-concept demonstrating **automated case routing** for a field service operation.
Cases are routed to technicians based on the customer's region using a transparent rule engine — no AI black box, just clear logic that you can explain in a classroom.

---

## What the app shows

| Screen | Path | Purpose |
|---|---|---|
| Log Case | `/` | Public form — search customer, pick asset, submit |
| Case List | `/cases` | Admin view — all cases, status, technician, feedback |
| Case Detail | `/cases/:id` | Routing explanation, close action, feedback |
| Technician Map | `/technicians` | Region → technician table + routing code display |

---

## Running locally

### Prerequisites
- Node.js 18+ (for native `fetch` in Netlify Functions)
- npm

### Steps

```bash
# 1. Clone or download the project
cd case-routing-demo

# 2. Install dependencies
npm install

# 3. Copy the env example and fill in your Telegram values (optional)
cp .env.example .env

# 4a. Run frontend only (no Telegram notifications)
npm run dev
# → open http://localhost:5173

# 4b. Run with Netlify Functions (Telegram notifications active)
npm install -g netlify-cli
netlify dev
# → open http://localhost:8888
```

---

## Telegram Bot setup

You only need this if you want live Telegram notifications. The app works fully without it.

### Step 1 — Create a bot
1. Open Telegram and message **@BotFather**
2. Send `/newbot` and follow the prompts
3. Copy the **bot token** (looks like `7123456789:AAF...`)

### Step 2 — Get chat IDs
Each person (technician or customer) must:
1. Search for your bot by its username and click **Start**
2. Message the bot with any text (e.g. `/start`)
3. Open `https://api.telegram.org/bot<TOKEN>/getUpdates` in a browser
4. Find `"chat":{"id": 123456789}` — that number is their chat ID

Alternatively, message **@userinfobot** in Telegram — it replies with your chat ID.

### Step 3 — Set environment variables

For **local development** — add to `.env`:
```
TELEGRAM_BOT_TOKEN=7123456789:AAFxxxxxx

# Technicians (ask each person to message your bot first)
TELEGRAM_JONATHAN_CHAT_ID=111222333
TELEGRAM_PETER_CHAT_ID=444555666
TELEGRAM_PORTIA_CHAT_ID=777888999

# Customers (for closure notifications — optional for demo)
TELEGRAM_CUST_C0001_CHAT_ID=
TELEGRAM_CUST_C0002_CHAT_ID=
TELEGRAM_CUST_C0003_CHAT_ID=
TELEGRAM_CUST_C0004_CHAT_ID=
TELEGRAM_CUST_C0005_CHAT_ID=
```

For **Netlify** — go to  
`Site → Settings → Environment variables → Add variable`  
and add each key above.

---

## Deploying to Netlify (public link for your MBA group)

### Option A — Netlify Drop (quickest)
```bash
npm run build
# Drag the dist/ folder to https://app.netlify.com/drop
# You get a public URL instantly.
# Note: Netlify Drop does NOT support Functions, so Telegram is disabled.
```

### Option B — GitHub + Netlify (recommended, includes Functions)
```bash
# Push to a GitHub repo
git init && git add . && git commit -m "initial"
gh repo create case-routing-demo --public --push

# Then in Netlify:
# New site → Import from Git → Select your repo
# Build command:  npm run build
# Publish dir:    dist
# Functions dir:  netlify/functions  (auto-detected from netlify.toml)
# Add environment variables (Step 3 above)
```

---

## Project structure

```
case-routing-demo/
├── src/
│   ├── data/seed.js          ← ALL demo data lives here — edit freely
│   ├── utils/routing.js      ← The routing engine (REGION_ROUTING map)
│   ├── utils/telegram.js     ← Frontend API helpers
│   ├── context/AppContext.jsx ← State (localStorage, no DB)
│   └── pages/
│       ├── CaseFormPage.jsx
│       ├── CaseListPage.jsx
│       ├── CaseDetailPage.jsx
│       └── TechnicianTablePage.jsx
├── netlify/functions/
│   ├── notify-assignment.js  ← Sends Telegram to technician
│   └── notify-closure.js     ← Sends Telegram to customer
├── netlify.toml
└── .env.example
```

---

## Seeded demo data

### Customers
| # | Name | Region | Routes to |
|---|---|---|---|
| C-0001 | Acme Manufacturing | Johannesburg, South Africa | Jonathan |
| C-0002 | TechHub Pretoria | Pretoria, Gauteng | Peter |
| C-0003 | Port Solutions Ltd | Port Elizabeth, Eastern Cape | Portia |
| C-0004 | Gauteng Systems | Pretoria, Gauteng | Peter |
| C-0005 | Joburg Retail Group | Johannesburg, South Africa | Jonathan |

### Routing rules (src/data/seed.js → REGION_ROUTING)
```js
'Johannesburg, South Africa'   → TECH-001  // Jonathan
'Pretoria, Gauteng'            → TECH-002  // Peter
'Port Elizabeth, Eastern Cape' → TECH-003  // Portia
```

---

## Demonstrating the routing logic for your MBA group

1. Go to **Log Case** and search "Acme" → select the customer → submit
2. The success card shows the routing decision:  
   *"Auto-routed to Jonathan — region rule: Johannesburg, South Africa → Jonathan"*
3. Repeat with "TechHub" (→ Peter) and "Port Solutions" (→ Portia)
4. Open the **Technician Map** tab — the live code block shows the routing rules
5. Go to **Case List** → click a case → close it → submit feedback
6. The **Technician Map** updates with open/closed counts and average ratings

---

## Limitations (intentional for demo simplicity)

- **No database** — state lives in the browser's `localStorage`. Each visitor sees only their own cases.
- **Telegram feedback** is one-way (outbound only). The demo collects ratings via the web form. A production upgrade would set up a Telegram webhook to receive replies.
- **No authentication** — anyone with the URL can submit cases. Add Netlify Identity or Auth0 for a real product.

---

## Upgrade path (post-MBA)

| Feature | What to add |
|---|---|
| Persistent shared data | Supabase (free tier) or PlanetScale |
| Auth | Netlify Identity or Clerk |
| Two-way Telegram feedback | Telegram Webhook + serverless handler |
| Richer routing rules | Priority × region × technician schedule |
| Mobile app | React Native or Expo (same routing logic) |
