// ================================================================
// SEED DATA
// Edit this file to add, remove, or change customers, assets,
// technicians, and region routing rules.
// No database needed — the app stores live cases in localStorage.
// ================================================================

// ── Technicians ──────────────────────────────────────────────
// Each technician is responsible for one region.
// telegramChatId is resolved server-side from env vars (see
// netlify/functions/notify-assignment.js) so it is null here.
export const technicians = [
  {
    id: 'TECH-001',
    name: 'Jonathan',
    region: 'Johannesburg, South Africa',
    telegramChatId: '',
  },
  {
    id: 'TECH-002',
    name: 'Peter',
    region: 'Pretoria, Gauteng',
    telegramChatId: '',
  },
  {
    id: 'TECH-003',
    name: 'Portia',
    region: 'Port Elizabeth, Eastern Cape',
    telegramChatId: '',
  },
]

// ── Region → Technician routing table ────────────────────────
// THIS is the "agent-like" rule engine.
// Add a new line here to add a new region.
export const REGION_ROUTING = {
  'Johannesburg, South Africa':    'TECH-001', // → Jonathan
  'Pretoria, Gauteng':             'TECH-002', // → Peter
  'Port Elizabeth, Eastern Cape':  'TECH-003', // → Portia
}

export const REGIONS = Object.keys(REGION_ROUTING)

// ── Customers ─────────────────────────────────────────────────
// At least one customer per region so routing can be demonstrated.
// customerNumber must be unique — it is used as a search key.
export const customers = [
  {
    id: 'CUST-001',
    name: 'Acme Manufacturing',
    customerNumber: 'C-0001',
    region: 'Johannesburg, South Africa',
    email: 'support@acme.co.za',
    telegramChatId: '',
  },
  {
    id: 'CUST-002',
    name: 'TechHub Pretoria',
    customerNumber: 'C-0002',
    region: 'Pretoria, Gauteng',
    email: 'help@techhub.co.za',
    telegramChatId: '',
  },
  {
    id: 'CUST-003',
    name: 'Port Solutions Ltd',
    customerNumber: 'C-0003',
    region: 'Port Elizabeth, Eastern Cape',
    email: 'it@portsolutions.co.za',
    telegramChatId: '',
  },
  {
    id: 'CUST-004',
    name: 'Gauteng Systems',
    customerNumber: 'C-0004',
    region: 'Pretoria, Gauteng',
    email: 'desk@gauteng-sys.co.za',
    telegramChatId: '',
  },
  {
    id: 'CUST-005',
    name: 'Joburg Retail Group',
    customerNumber: 'C-0005',
    region: 'Johannesburg, South Africa',
    email: 'it@joburgretail.co.za',
    telegramChatId: '',
  },
]

// ── Assets ────────────────────────────────────────────────────
// Each asset belongs to one customer via customerId.
// assetNumber must be unique — it is used as a search key.
export const assets = [
  { id: 'ASSET-001', assetNumber: 'A-1001', description: 'HP LaserJet Pro M404n',        customerId: 'CUST-001' },
  { id: 'ASSET-002', assetNumber: 'A-1002', description: 'Cisco Catalyst 2960 Switch',   customerId: 'CUST-001' },
  { id: 'ASSET-003', assetNumber: 'A-2001', description: 'Dell PowerEdge R540 Server',   customerId: 'CUST-002' },
  { id: 'ASSET-004', assetNumber: 'A-3001', description: 'APC Smart-UPS 1500VA',         customerId: 'CUST-003' },
  { id: 'ASSET-005', assetNumber: 'A-3002', description: 'Lenovo ThinkCentre M90n',      customerId: 'CUST-003' },
  { id: 'ASSET-006', assetNumber: 'A-4001', description: 'Fortinet FortiGate 60F',       customerId: 'CUST-004' },
  { id: 'ASSET-007', assetNumber: 'A-5001', description: 'Epson WorkForce Pro WF-C8610', customerId: 'CUST-005' },
]
