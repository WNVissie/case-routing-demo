import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { customers as seedCustomers, assets as seedAssets, technicians as seedTechnicians } from '../data/seed.js'

const AppContext = createContext(null)
const STORAGE_KEY = 'case_routing_demo_v1'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const defaultState = {
  customers: seedCustomers,
  assets: seedAssets,
  technicians: seedTechnicians,
  cases: [],
  demoChatId: '',
}

function reducer(state, action) {
  switch (action.type) {

    case 'ADD_CASE':
      return { ...state, cases: [action.payload, ...state.cases] }

    case 'CONFIRM_CASE':
      return {
        ...state,
        cases: state.cases.map((c) =>
          c.id === action.payload.id
            ? { ...c, confirmed: true, confirmedAt: new Date().toISOString() }
            : c
        ),
      }

    case 'CUSTOMER_ACKNOWLEDGE':
      return {
        ...state,
        cases: state.cases.map((c) =>
          c.id === action.payload.id
            ? { ...c, customerAcknowledged: true, customerAcknowledgedAt: new Date().toISOString() }
            : c
        ),
      }

    case 'CLOSE_CASE':
      return {
        ...state,
        cases: state.cases.map((c) =>
          c.id === action.payload.id
            ? { ...c, status: 'closed', closedAt: new Date().toISOString(), closureNote: action.payload.closureNote }
            : c
        ),
      }

    case 'ADD_FEEDBACK':
      return {
        ...state,
        cases: state.cases.map((c) =>
          c.id === action.payload.id
            ? { ...c, feedback: action.payload.score, feedbackComment: action.payload.comment }
            : c
        ),
      }

    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] }

    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload } : c
        ),
      }

    case 'UPDATE_TECHNICIAN':
      return {
        ...state,
        technicians: state.technicians.map((t) =>
          t.id === action.payload.id ? { ...t, ...action.payload } : t
        ),
      }

    case 'SET_DEMO_CHAT_ID': {
      const chatId = action.payload
      return {
        ...state,
        demoChatId: chatId,
        // Apply to all technicians that don't have a specific ID set
        technicians: state.technicians.map((t) => ({ ...t, telegramChatId: chatId })),
      }
    }

    case 'RESET':
      return defaultState

    default:
      return state
  }
}

export function AppProvider({ children }) {
  // Merge saved state with defaultState so any newly-added keys (e.g. technicians)
  // are always present even when localStorage has an older snapshot.
  const [state, dispatch] = useReducer(reducer, { ...defaultState, ...(loadState() || {}) })

  // Persist every state change to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used inside AppProvider')
  return ctx
}
