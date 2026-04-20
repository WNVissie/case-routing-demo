import React from 'react'
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext.jsx'
import CaseFormPage        from './pages/CaseFormPage.jsx'
import CaseListPage        from './pages/CaseListPage.jsx'
import CaseDetailPage      from './pages/CaseDetailPage.jsx'
import TechnicianTablePage from './pages/TechnicianTablePage.jsx'

function NavBar() {
  const { dispatch } = useApp()
  const active   = 'px-3 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white'
  const inactive = 'px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-700 transition-colors'

  return (
    <nav className="bg-blue-800 shadow-lg">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap gap-2 items-center">
        <span className="font-bold text-white text-lg mr-4 tracking-tight">
          ⚡ CaseRouter
        </span>
        <NavLink to="/" end className={({ isActive }) => isActive ? active : inactive}>
          Log Case
        </NavLink>
        <NavLink to="/cases" className={({ isActive }) => isActive ? active : inactive}>
          Case List
        </NavLink>
        <NavLink to="/technicians" className={({ isActive }) => isActive ? active : inactive}>
          Technician Map
        </NavLink>

        {/* Demo reset button — clears localStorage back to seed state */}
        <button
          onClick={() => {
            if (window.confirm('Reset all demo cases and customers back to seed data?')) {
              dispatch({ type: 'RESET' })
            }
          }}
          className="ml-auto px-3 py-1.5 text-xs font-medium text-blue-200 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Reset Demo
        </button>
      </div>
    </nav>
  )
}

function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 py-8">
        <Routes>
          <Route path="/"              element={<CaseFormPage />}        />
          <Route path="/cases"         element={<CaseListPage />}        />
          <Route path="/cases/:id"     element={<CaseDetailPage />}      />
          <Route path="/technicians"   element={<TechnicianTablePage />} />
        </Routes>
      </main>
      <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-200 mt-12">
        CaseRouter — MBA Field Service Routing Demo · localStorage persistence · No database
      </footer>
    </div>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AppProvider>
  )
}
