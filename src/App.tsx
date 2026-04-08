import { useState } from 'react'
import './App.css'

const navItems = [
  { label: 'Dashboard', icon: '▦' },
  { label: 'Gestion des transporteurs', icon: '◎' },
  { label: 'Gestion des agriculteurs', icon: '◈' },
  { label: 'Gestion des routes', icon: '⟋' },
  { label: 'Gestion des commandes', icon: '◻' },
]

const stats = [
  { label: 'Commandes actives', value: '—' },
  { label: 'Transporteurs en route', value: '—' },
  { label: 'Agriculteurs inscrits', value: '—' },
  { label: 'Routes configurées', value: '—' },
]

function App() {
  const [active, setActive] = useState('Dashboard')

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-dot" />
          <span className="logo-text">RoutIA</span>
          <span className="logo-badge">LITE</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.label}
              className={`nav-item ${active === item.label ? 'nav-item--active' : ''}`}
              onClick={() => setActive(item.label)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {active === item.label && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">A</div>
            <span>Admin</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h1 className="page-title">{active}</h1>
          <div className="topbar-right">
            <div className="status-pill">
              <span className="status-dot" />
              Système opérationnel
            </div>
          </div>
        </header>

        {active === 'Dashboard' && (
          <div className="dashboard">
            <div className="stats-grid">
              {stats.map((s) => (
                <div key={s.label} className="stat-card">
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>

            <div className="panels-grid">
              <div className="panel">
                <div className="panel-header">
                  <span>Commandes récentes</span>
                  <span className="panel-tag">En attente de données</span>
                </div>
                <div className="panel-empty">Aucune commande pour le moment</div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <span>Transporteurs en livraison</span>
                  <span className="panel-tag">En attente de données</span>
                </div>
                <div className="panel-empty">Aucun transporteur actif</div>
              </div>

              <div className="panel panel--wide">
                <div className="panel-header">
                  <span>Suivis en temps réel</span>
                  <span className="panel-tag">En attente de données</span>
                </div>
                <div className="panel-empty">Carte non configurée</div>
              </div>
            </div>
          </div>
        )}

        {active !== 'Dashboard' && (
          <div className="placeholder-page">
            <div className="placeholder-icon">◻</div>
            <p className="placeholder-title">{active}</p>
            <p className="placeholder-sub">Module en cours de développement</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App