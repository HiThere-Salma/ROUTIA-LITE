import './App.css'
import { useState } from 'react'

const navItems = [
  { label: 'Dashboard', icon: '▦' },
  { label: 'Gestion des commandes', icon: '📋' },
  { label: 'Gestion des transporteurs', icon: '🚚' },
  { label: 'Gestion des agriculteurs', icon: '🌾' },
  { label: 'Gestion des routes', icon: '🗺️' },
]

const stats = [
  { label: 'Total commandes', value: '—', badge: '', badgeType: '' },
  { label: 'Commandes en cours', value: '—', badge: 'En cours', badgeType: 'info' },
  { label: 'Transporteurs actifs', value: '—', badge: 'Actifs', badgeType: 'success' },
  { label: 'Livraisons complétées', value: '—', badge: 'Succès', badgeType: 'success' },
]

const commandes = [
  { id: '#ORD-9021', client: 'Ferme du Soleil', statut: 'En route', statusType: 'route', date: '12 Oct 2024', montant: '—' },
  { id: '#ORD-9022', client: 'Jean Dupont', statut: 'Préparation', statusType: 'prep', date: '12 Oct 2024', montant: '—' },
  { id: '#ORD-8998', client: 'Bio-Logique SARL', statut: 'Livré', statusType: 'livre', date: '11 Oct 2024', montant: '—' },
]

const activite = [
  { type: 'success', title: 'Livraison validée', desc: 'Commande #ORD-8998 signée par le client.', time: 'Il y a 2 min' },
  { type: 'warning', title: 'Alerte retard', desc: 'Le transporteur Marc L. signale un trafic dense.', time: 'Il y a 14 min' },
  { type: 'info', title: 'Nouvelle commande', desc: 'Assignation automatique pour #ORD-9025.', time: 'Il y a 1h' },
]

const transporteurs = [
  { nom: 'Marc Lefebvre', route: 'Paris → Lyon', progress: 85 },
  { nom: 'Sophie Martin', route: 'Bordeaux → Toulouse', progress: 22 },
]

function App() {
  const [active, setActive] = useState('Dashboard')

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span className="logo-text">ROUTIA</span>
          <span className="logo-sub">COMMAND CENTER</span>
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
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar">A</div>
            <div>
              <div className="user-name">Admin User</div>
              <div className="user-role">Logistics Ops</div>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-search">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Rechercher une commande, un transporteur..." />
          </div>
          <div className="topbar-right">
            <button className="icon-btn">🔔</button>
            <button className="icon-btn">⚙️</button>
          </div>
        </header>

        <div className="dashboard">
          <div className="dashboard-hero">
            <h1 className="dashboard-title">Tableau de Bord</h1>
            <p className="dashboard-sub">Vue d'ensemble de la performance logistique en temps réel.</p>
          </div>

          <div className="stats-grid">
            {stats.map((s) => (
              <div key={s.label} className="stat-card">
                <div className="stat-card-top">
                  <span className="stat-icon">📊</span>
                  {s.badge && <span className={`badge badge--${s.badgeType}`}>{s.badge}</span>}
                </div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-bar" />
              </div>
            ))}
          </div>

          <div className="bottom-grid">
            <div className="bottom-left">
              <div className="panel">
                <div className="panel-header">
                  <span>Commandes récentes</span>
                  <button className="link-btn">Voir tout</button>
                </div>
                <table className="cmd-table">
                  <thead>
                    <tr>
                      <th>ID Commande</th>
                      <th>Client / Agriculteur</th>
                      <th>Statut</th>
                      <th>Date</th>
                      <th>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {commandes.map((c) => (
                      <tr key={c.id}>
                        <td className="cmd-id">{c.id}</td>
                        <td>{c.client}</td>
                        <td><span className={`status-badge status--${c.statusType}`}>{c.statut}</span></td>
                        <td className="muted">{c.date}</td>
                        <td className="cmd-montant">{c.montant}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="panel" style={{ marginTop: '14px' }}>
                <div className="panel-header">
                  <span>Transporteurs en cours de livraison</span>
                </div>
                <div className="transporteurs-list">
                  {transporteurs.map((t) => (
                    <div key={t.nom} className="transporteur-card">
                      <div className="t-icon">🚚</div>
                      <div className="t-info">
                        <div className="t-name">{t.nom}</div>
                        <div className="t-route">Route: {t.route}</div>
                      </div>
                      <div className="t-progress-wrap">
                        <span className="t-pct">{t.progress}%</span>
                        <div className="t-bar">
                          <div className="t-bar-fill" style={{ width: `${t.progress}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel activite-panel">
              <div className="panel-header">
                <span>Activité Récente</span>
              </div>
              <div className="activite-list">
                {activite.map((a, i) => (
                  <div key={i} className="activite-item">
                    <span className={`activite-dot dot--${a.type}`} />
                    <div>
                      <div className="activite-title">{a.title}</div>
                      <div className="activite-desc">{a.desc}</div>
                      <div className="activite-time">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <button className="fab">+</button>
    </div>
  )
}

export default App