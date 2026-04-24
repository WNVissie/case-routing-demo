import React, { useState } from 'react'
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext.jsx'
import WelcomePage         from './pages/WelcomePage.jsx'
import CaseFormPage        from './pages/CaseFormPage.jsx'
import CaseListPage        from './pages/CaseListPage.jsx'
import CaseDetailPage      from './pages/CaseDetailPage.jsx'
import TechnicianTablePage from './pages/TechnicianTablePage.jsx'
import FeedbackPage        from './pages/FeedbackPage.jsx'

const NAV_LINKS = [
  { to: '/',             label: 'Home' },
  { to: '/log',          label: 'Log Case' },
  { to: '/cases',        label: 'Case List' },
  { to: '/technicians',  label: 'Technician Map' },
  { to: '/feedback',     label: 'Feedback' },
]

function NavBar() {
  const { dispatch } = useApp()
  const [open, setOpen] = useState(false)
  const location = useLocation()

  // Close menu on route change
  React.useEffect(() => { setOpen(false) }, [location.pathname])

  const activeClass   = 'block px-4 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white'
  const inactiveClass = 'block px-4 py-2 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-700 transition-colors'

  function handleReset() {
    setOpen(false)
    if (window.confirm('Reset all demo cases and customers back to seed data?')) {
      dispatch({ type: 'RESET' })
    }
  }

  return (
    <nav className="bg-blue-800 shadow-lg relative z-50">
      <div className="max-w-5xl mx-auto px-4">
        {/* Top bar */}
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <NavLink to="/" className="font-bold text-white text-lg tracking-tight hover:text-blue-200 transition-colors flex-shrink-0">
            ⚡ CaseRouter
          </NavLink>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1 ml-6">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  isActive
                    ? 'px-3 py-2 rounded-lg text-sm font-semibold bg-blue-700 text-white'
                    : 'px-3 py-2 rounded-lg text-sm font-medium text-blue-100 hover:bg-blue-700 transition-colors'
                }
              >
                {label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Reset button — desktop only */}
            <button
              onClick={handleReset}
              className="hidden md:block px-3 py-1.5 text-xs font-medium text-blue-200 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Reset Demo
            </button>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setOpen((o) => !o)}
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${open ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block w-5 h-0.5 bg-white my-1 transition-all duration-200 ${open ? 'opacity-0' : ''}`} />
              <span className={`block w-5 h-0.5 bg-white transition-all duration-200 ${open ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {open && (
          <div className="md:hidden border-t border-blue-700 py-3 space-y-1">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => isActive ? activeClass : inactiveClass}
              >
                {label}
              </NavLink>
            ))}
            <div className="pt-2 border-t border-blue-700 mt-2">
              <button
                onClick={handleReset}
                className="block w-full text-left px-4 py-2 rounded-lg text-sm font-medium text-red-300 hover:bg-blue-700 transition-colors"
              >
                Reset Demo
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/"            element={<WelcomePage />}        />
          <Route path="/log"         element={<CaseFormPage />}        />
          <Route path="/cases"       element={<CaseListPage />}        />
          <Route path="/cases/:id"   element={<CaseDetailPage />}      />
          <Route path="/technicians" element={<TechnicianTablePage />} />
          <Route path="/feedback"    element={<FeedbackPage />}        />
        </Routes>
      </main>
      <footer className="text-center text-xs text-gray-400 py-6 border-t border-gray-200 mt-12 px-4">
        CaseRouter — MBA Field Service Routing Demo · localStorage · No database · Built with React + Vite
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
