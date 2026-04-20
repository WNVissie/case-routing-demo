import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { customers as seedCustomers, assets as seedAssets } from '../data/seed.js'

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
  cases: [],
}

function reducer(state, action) {
  switch (action.type) {

    case 'ADD_CASE':
      return { ...state, cases: [action.payload, ...state.cases] }

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

    case 'RESET':
      return defaultState

    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, loadState() || defaultState)

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
