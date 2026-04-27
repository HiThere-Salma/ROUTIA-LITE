import './App.css'
import { useState, useEffect } from 'react'
import { getSupabaseClient } from './lib/supabase'
import { ClipboardClock, Truck, CircleCheckBig, ChartColumn, Bell, Settings, Sprout, Map, LayoutDashboard, Loader, MailX, ClipboardList, LogOut, ShieldCheck } from 'lucide-react'
import AgriculteurPage from './pages/AgriculteurPage'
import TransporteurPage from './pages/TransporteurPage'
import RoutePage from './pages/RoutePage'
import CommandesPage from './commandes/Pages/CommandesPage'
import LoginPage from './pages/LoginPage'
import AdminManagementPage from './pages/AdminManagementPage'

type Admin = {
  id: string
  email: string
  nom: string | null
  prenom: string | null
  numero_tel: string | null
  adresse: string | null
  nom_complet?: string | null
  issuper?: boolean | null
  created_at: string
}

type Commande = {
  id: string
  produit: string
  prix: number
  statut: string
  date_collecte: string
  agriculteur_id: string
  utilisateurs: { prenom: string; nom: string } | null
}

type Route = {
  id: string
  transporteur_id: string
  date: string
  heure_depart: string
  heure_fin: string
  distance_totale: number
  utilisateurs: { prenom: string; nom: string } | null
}

type Stats = {
  totalCommandes: number
  commandesEnCours: number
  transporteursActifs: number
  livraisonsCompletes: number
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
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [active, setActive] = useState('Dashboard')
  const [isAgriModalOpen, setIsAgriModalOpen] = useState(false)
  const [isTrModalOpen, setIsTrModalOpen] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [stats, setStats] = useState<Stats>({
    totalCommandes: 0,
    commandesEnCours: 0,
    transporteursActifs: 0,
    livraisonsCompletes: 0,
  })
  const [loading, setLoading] = useState(true)

  function handleNavChange(label: string) {
    setActive(label)
    setShowArchived(false)
  }

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={16} /> },
    ...(admin?.issuper ? [{ label: 'Gestion des administrateurs', icon: <ShieldCheck size={16} /> }] : []),
    { label: 'Gestion des transporteurs', icon: <Truck size={16} /> },
    { label: 'Gestion des agriculteurs', icon: <Sprout size={16} /> },
    { label: 'Gestion des routes', icon: <Map size={16} /> },
    { label: 'Gestion des commandes', icon: <ClipboardList size={16} /> },
  ]

  async function fetchDashboardData() {
    setLoading(true)
    try {
      const supabase = getSupabaseClient()
      const [
        { data: allCommandes },
        { data: recentCommandes },
        { data: transporteurs },
        { data: recentRoutes },
      ] = await Promise.all([
        supabase.from('commandes').select('statut'),
        supabase.from('commandes').select('id, produit, prix, statut, date_collecte, agriculteur_id, utilisateurs!agriculteur_id(prenom, nom)').order('date_collecte', { ascending: false }).limit(5),
        supabase.from('utilisateurs').select('id').eq('role', 'transporteur'),
        supabase.from('routes').select('id, transporteur_id, date, heure_depart, heure_fin, distance_totale, utilisateurs!transporteur_id(prenom, nom)').order('date', { ascending: false }).limit(3),
      ])
      const total = allCommandes?.length ?? 0
      const enCours = allCommandes?.filter(c => c.statut === 'en_attente' || c.statut === 'assignee' || c.statut === 'recuperee' || c.statut === 'en_transport').length ?? 0
      const livres = allCommandes?.filter(c => c.statut === 'livree').length ?? 0
      setStats({ totalCommandes: total, commandesEnCours: enCours, transporteursActifs: transporteurs?.length ?? 0, livraisonsCompletes: livres })
      setCommandes((recentCommandes as unknown as Commande[]) ?? [])
      setRoutes((recentRoutes as unknown as Route[]) ?? [])
    } catch (err) {
      console.error('Erreur Supabase:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!admin) return
    async function load() { await fetchDashboardData() }
    void load()
  }, [admin])

  useEffect(() => {
    if (!admin?.issuper && active === 'Gestion des administrateurs') {
      queueMicrotask(() => setActive('Dashboard'))
    }
  }, [admin, active])

  async function handleLogin(email: string, password: string) {
    setLoginError('')
    setLoginLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (authError) {
        const authMessage = authError.message.toLowerCase()
        if (authMessage.includes('email not confirmed') || authMessage.includes('email not verified')) {
          setLoginError('Email non verifie. Ouvrez le lien recu par email puis reconnectez-vous.')
        } else {
          setLoginError('Email ou mot de passe incorrect.')
        }
        setLoginLoading(false)
        return
      }
      const { data: adminData, error: adminError } = await supabase
        .from('admin')
        .select('*')
        .eq('email', authData.user.email)
        .single()
      if (adminError || !adminData) {
        await supabase.auth.signOut()
        setLoginError("Cet utilisateur n'a pas les droits administrateur.")
        setLoginLoading(false)
        return
      }
      setAdmin(adminData as Admin)
    } catch {
      setLoginError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleLogout() {
    await getSupabaseClient().auth.signOut()
    setAdmin(null)
  }

  const statsCards = [
    { label: 'Total commandes', value: stats.totalCommandes, badge: '', badgeType: '', icon: <ChartColumn size={22} color="var(--green)" /> },
    { label: 'Commandes en cours', value: stats.commandesEnCours, badge: '', badgeType: 'info', icon: <ClipboardClock size={22} color="var(--green)" /> },
    { label: 'Transporteurs actifs', value: stats.transporteursActifs, badge: '', badgeType: 'success', icon: <Truck size={22} color="var(--green)" /> },
    { label: 'Livraisons complétées', value: stats.livraisonsCompletes, badge: '', badgeType: 'success', icon: <CircleCheckBig size={22} color="var(--green)" /> },
  ]

  if (!admin) {
    return <LoginPage onSubmit={handleLogin} error={loginError} loading={loginLoading} />
  }

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
            <div className="user-avatar">{admin.prenom?.[0] ?? 'A'}</div>
            <div>
              <div className="user-name">{admin.prenom} {admin.nom_complet ?? admin.nom}</div>
              <div className="user-role">{admin.email}</div>
            </div>
            <button className="icon-btn logout-btn" onClick={handleLogout} title="Déconnexion">
              <LogOut size={14} />
            </button>
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

        {active === 'Gestion des administrateurs' && <AdminManagementPage currentAdmin={admin} />}
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
                    {s.badge && <span className={`badge badge--${s.badgeType}`}>{s.badge}</span>}
                  </div>
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value">
                    {loading ? <span className="loading-dash">—</span> : s.value}
                  </div>
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
                  {commandes.slice(0, 3).map((c: Commande, i: number) => (
                    <div key={i} className="activite-item">
                      <div className="activite-dot-wrap">
                        <span className={`activite-dot dot--${statusType(c.statut)}`} />
                        {i < 2 && <span className="activite-line" />}
                      </div>
                      <div>
                        <div className="activite-title">
                          {c.statut === 'livree' ? 'Livraison validée' :
                            c.statut === 'en_transport' ? 'En cours de livraison' :
                              c.statut === 'recuperee' ? 'Commande récupérée' :
                                c.statut === 'assignee' ? 'Commande assignée' :
                                  'Commande en attente'}
                        </div>
                        <div className="activite-desc">
                          {c.utilisateurs?.prenom} {c.utilisateurs?.nom} — {c.produit}
                        </div>
                        <div className="activite-time">{c.date_collecte ?? '—'}</div>
                      </div>
                    </div>
                  ))}
                  {commandes.length === 0 && !loading && (
                    <div className="panel-empty">
                      <MailX size={28} color="var(--text-dim)" />
                      <span>Aucune activité récente</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {active === 'Gestion des routes' && <RoutePage />}
        {active === 'Gestion des commandes' && <CommandesPage />}
      </main>
    </div>
  )
}

export default App