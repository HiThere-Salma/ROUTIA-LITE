import './App.css'
import { useState } from 'react'
import { ClipboardClock, Truck, Bell, Settings, Sprout, Map, LayoutDashboard, Loader, MailX, ClipboardList, Navigation, Route } from 'lucide-react'
import AgriculteurPage from './modules/agriculteur/pages/AgriculteurPage'
import TransporteurPage from './modules/transporteur/pages/TransporteurPage'
import RoutePage from './pages/RoutePage'
import { useDashboard } from './modules/dashboard/hooks/useDashboard'
import type { CommandeRecente } from './modules/dashboard/types/dashboard.types'

const navItems = [
  { label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
  { label: 'Gestion des transporteurs', icon: <Truck size={16} /> },
  { label: 'Gestion des agriculteurs', icon: <Sprout size={16} /> },
  { label: 'Gestion des routes', icon: <Map size={16} /> },
  { label: 'Gestion des commandes', icon: <ClipboardList size={16} /> },
]

type StatCard = {
  label: string
  value: number
  secondaryLabel?: string
  secondaryValue?: number
  icon: React.ReactNode
}

function statusType(statut: string) {
  switch (statut) {
    case 'livree': return 'livre'
    case 'en_transport': return 'route'
    case 'en_attente': return 'attente'
    case 'assignee': return 'assignee'
    case 'recuperee': return 'recuperee'
    default: return 'attente'
  }
}

function statusLabel(statut: string) {
  switch (statut) {
    case 'livree': return 'Livrée'
    case 'en_transport': return 'En transport'
    case 'en_attente': return 'En attente'
    case 'assignee': return 'Assignée'
    case 'recuperee': return 'Récupérée'
    default: return statut
  }
}

function App() {
  const [active, setActive] = useState('Dashboard')
  const [isAgriModalOpen, setIsAgriModalOpen] = useState(false)
  const [isTrModalOpen, setIsTrModalOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const { stats, commandesRecentes: commandes, routesRecentes: routes, isLoading: loading } = useDashboard()

  function handleNavChange(label: string) {
    setActive(label)
    setShowArchived(false)
  }

  const statsCards: StatCard[] = [
    {
      label: 'Transporteurs en livraison',
      value: stats.transporteursEnLivraison,
      icon: <Truck size={22} color="var(--green)" />,
    },
    {
      label: 'Km parcourus ce mois',
      value: stats.kmDuMois,
      icon: <Navigation size={22} color="var(--green)" />,
    },
    {
      label: 'Routes en cours',
      value: stats.routesEnCours,
      secondaryLabel: 'Complétées ce mois',
      secondaryValue: stats.routesLivreesDuMois,
      icon: <Route size={22} color="var(--green)" />,
    },
    {
      label: 'Commandes en cours',
      value: stats.commandesEnCours,
      secondaryLabel: 'Livrées ce mois',
      secondaryValue: stats.commandesLivreesDuMois,
      icon: <ClipboardClock size={22} color="var(--green)" />,
    },
  ]

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
              onClick={() => handleNavChange(item.label)}
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
            <input
              className="search-input"
              placeholder={
                active === 'Gestion des agriculteurs' ? 'Rechercher un agriculteur, un CIN ou une ville...' :
                active === 'Gestion des transporteurs' ? 'Rechercher un transporteur...' :
                'Rechercher une commande, un transporteur...'
              }
            />
          </div>
          {(active === 'Gestion des agriculteurs' || active === 'Gestion des transporteurs') && (
            <div className="tr-view-toggle topbar-toggle">
              <button
                className={`tr-toggle-btn${!showArchived ? ' tr-toggle-btn--active' : ''}`}
                onClick={() => setShowArchived(false)}
              >
                Actifs
              </button>
              <button
                className={`tr-toggle-btn${showArchived ? ' tr-toggle-btn--active' : ''}`}
                onClick={() => setShowArchived(true)}
              >
                Archivés
              </button>
            </div>
          )}
          <div className="topbar-right">
            {active === 'Gestion des agriculteurs' && (
              <button className="btn-add-agri" onClick={() => setIsAgriModalOpen(true)}>＋ Ajouter un agriculteur</button>
            )}
            {active === 'Gestion des transporteurs' && (
              <button className="btn-add-agri" onClick={() => setIsTrModalOpen(true)}>＋ Ajouter un transporteur</button>
            )}
            <button className="icon-btn"><Bell size={16} /></button>
            <button className="icon-btn"><Settings size={16} /></button>
          </div>
        </header>

        {active === 'Gestion des agriculteurs' && (
          <AgriculteurPage isModalOpen={isAgriModalOpen} onCloseModal={() => setIsAgriModalOpen(false)} showArchived={showArchived} />
        )}
        {active === 'Gestion des transporteurs' && (
          <TransporteurPage isModalOpen={isTrModalOpen} onCloseModal={() => setIsTrModalOpen(false)} showArchived={showArchived} />
        )}

        {active === 'Dashboard' && (
          <div className="dashboard">
            <div className="dashboard-hero">
              <h1 className="dashboard-title">Tableau de Bord</h1>
              <p className="dashboard-sub">Vue d'ensemble de la performance logistique en temps réel.</p>
            </div>

            <div className="stats-grid">
              {statsCards.map((s) => (
                <div key={s.label} className="stat-card">
                  <div className="stat-card-top">
                    {s.icon}
                  </div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">
                    {loading ? <span className="loading-dash">—</span> : s.value}
                  </div>
                  {s.secondaryLabel && (
                    <div className="stat-secondary">
                      <span className="stat-secondary-label">{s.secondaryLabel} :</span>
                      <span className="stat-secondary-value">
                        {loading ? '—' : s.secondaryValue}
                      </span>
                    </div>
                  )}
                  <div className="stat-bar" />
                </div>
              ))}
            </div>

            <div className="bottom-grid">
              <div className="bottom-left">
                <div className="panel">
                  <div className="panel-header">
                    <span>Commandes récentes</span>
                    <button className="link-btn" onClick={() => setActive('Gestion des commandes')}>Voir tout</button>
                  </div>
                  {loading ? (
                    <div className="panel-empty">
                      <Loader size={28} color="var(--text-dim)" />
                      <span>Chargement...</span>
                    </div>
                  ) : commandes.length === 0 ? (
                    <div className="panel-empty">
                      <ClipboardList size={28} color="var(--text-dim)" />
                      <span>Aucune commande pour le moment</span>
                    </div>
                  ) : (
                    <table className="cmd-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Agriculteur</th>
                          <th>Produit</th>
                          <th>Statut</th>
                          <th>Date</th>
                          <th>Prix</th>
                        </tr>
                      </thead>
                      <tbody>
                        {commandes.map((c) => (
                          <tr key={c.id}>
                            <td className="cmd-id">#{c.id.slice(0, 8)}</td>
                            <td>{c.utilisateurs?.prenom} {c.utilisateurs?.nom}</td>
                            <td>{c.produit}</td>
                            <td>
                              <span className={`status-badge status--${statusType(c.statut)}`}>
                                {statusLabel(c.statut)}
                              </span>
                            </td>
                            <td className="muted">{c.date_collecte ?? '—'}</td>
                            <td className="cmd-montant">{c.prix ? `${c.prix} MAD` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="panel" style={{ marginTop: '14px' }}>
                  <div className="panel-header">
                    <span>Routes récentes</span>
                    <button className="link-btn" onClick={() => setActive('Gestion des routes')}>Voir tout</button>
                  </div>
                  {loading ? (
                    <div className="panel-empty">
                      <Loader size={28} color="var(--text-dim)" />
                      <span>Chargement...</span>
                    </div>
                  ) : routes.length === 0 ? (
                    <div className="panel-empty">
                      <Map size={28} color="var(--text-dim)" />
                      <span>Aucune route pour le moment</span>
                    </div>
                  ) : (
                    <div className="transporteurs-list">
                      {routes.map((r) => (
                        <div key={r.id} className="transporteur-card">
                          <div className="t-icon"><Truck size={20} color="var(--green)" /></div>
                          <div className="t-info">
                            <div className="t-name">{r.utilisateurs?.prenom} {r.utilisateurs?.nom}</div>
                            <div className="t-route">{r.date} · {r.heure_depart} → {r.heure_fin}</div>
                          </div>
                          <div className="t-progress-wrap">
                            <span className="t-pct">{r.distance_totale ?? '—'} km</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="panel activite-panel">
                <div className="panel-header">
                  <span>Activité Récente</span>
                </div>
                <div className="activite-list">
                  {loading ? (
                    <div className="panel-empty">
                      <Loader size={28} color="var(--text-dim)" />
                      <span>Chargement...</span>
                    </div>
                  ) : commandes.length === 0 ? (
                    <div className="panel-empty">
                      <MailX size={28} color="var(--text-dim)" />
                      <span>Aucune activité récente</span>
                    </div>
                  ) : (
                    commandes.map((c: CommandeRecente) => (
                      <div key={c.id} className="activite-row">
                        <span className={`status-badge status--${statusType(c.statut)}`}>
                          {statusLabel(c.statut)}
                        </span>
                        <span className="activite-row-produit">{c.produit}</span>
                        <span className="activite-row-date">{c.date_collecte ?? '—'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {active === 'Gestion des routes' && <RoutePage />}
        {active === 'Gestion des commandes' && (
          <div className="placeholder-page">
            <div className="placeholder-icon"><LayoutDashboard size={36} color="var(--border)" /></div>
            <p className="placeholder-title">{active}</p>
            <p className="placeholder-sub">Module en cours de développement</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App