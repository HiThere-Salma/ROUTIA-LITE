import './App.css'
import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getSupabaseClient } from './lib/supabase'
import { ClipboardClock, Truck, CircleCheckBig, ChartColumn, Bell, Settings, Sprout, Map, LayoutDashboard, Loader, MailX, ClipboardList, LogOut, ShieldCheck } from 'lucide-react'
import AgriculteurPage from './pages/AgriculteurPage'
import TransporteurPage from './pages/TransporteurPage'
import RoutePage from './pages/RoutePage'
import LoginPage from './pages/LoginPage'
import AdminManagementPage from './pages/AdminManagementPage'
import CommandesPage from './commandes/Pages/CommandesPage'
import LanguageSwitcher from './components/LanguageSwitcher'

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
  const { t } = useTranslation()
  const [admin, setAdmin] = useState<Admin | null>(null)
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [active, setActive] = useState('Dashboard')
  const [commandes, setCommandes] = useState<Commande[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [stats, setStats] = useState<Stats>({
    totalCommandes: 0,
    commandesEnCours: 0,
    transporteursActifs: 0,
    livraisonsCompletes: 0,
  })
  const [loading, setLoading] = useState(true)
  const [agriModalOpen, setAgriModalOpen] = useState(false)
  const [agriShowArchived] = useState(false)
  const [transModalOpen, setTransModalOpen] = useState(false)
  const [transShowArchived] = useState(false)

  const navItems = [
    { key: 'Dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard size={16} /> },
    ...(admin?.issuper ? [{ key: 'Gestion des administrateurs', label: t('nav.admins'), icon: <ShieldCheck size={16} /> }] : []),
    { key: 'Gestion des transporteurs', label: t('nav.transporteurs'), icon: <Truck size={16} /> },
    { key: 'Gestion des agriculteurs', label: t('nav.agriculteurs'), icon: <Sprout size={16} /> },
    { key: 'Gestion des routes', label: t('nav.routes'), icon: <Map size={16} /> },
    { key: 'Gestion des commandes', label: t('nav.commandes'), icon: <ClipboardList size={16} /> },
  ]

  const effectiveActive = (!admin?.issuper && active === 'Gestion des administrateurs') ? 'Dashboard' : active

  useEffect(() => {
    if (!admin) return
    async function loadDashboard() {
      try {
        const [
          { data: allCommandes },
          { data: recentCommandes },
          { data: transporteurs },
          { data: recentRoutes },
        ] = await Promise.all([
          getSupabaseClient().from('commandes').select('statut'),
          getSupabaseClient().from('commandes').select('id, produit, prix, statut, date_collecte, agriculteur_id, utilisateurs!agriculteur_id(prenom, nom)').order('date_collecte', { ascending: false }).limit(5),
          getSupabaseClient().from('utilisateurs').select('id').eq('role', 'transporteur'),
          getSupabaseClient().from('routes').select('id, transporteur_id, date, heure_depart, heure_fin, distance_totale, utilisateurs!transporteur_id(prenom, nom)').order('date', { ascending: false }).limit(3),
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
    loadDashboard()
  }, [admin])

  async function handleLogin(email: string, password: string) {
    setLoginError('')
    setLoginLoading(true)
    try {
      const { data: authData, error: authError } = await getSupabaseClient().auth.signInWithPassword({
        email,
        password,
      })
      if (authError) {
        setLoginError('Email ou mot de passe incorrect.')
        setLoginLoading(false)
        return
      }
      const { data: adminData, error: adminError } = await getSupabaseClient()
        .from('admin')
        .select('*')
        .eq('email', authData.user.email)
        .single()
      if (adminError || !adminData) {
        await getSupabaseClient().auth.signOut()
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
    { label: t('stats.totalCommandes'), value: stats.totalCommandes, badge: '', badgeType: '', icon: <ChartColumn size={22} color="var(--green)" /> },
    { label: t('stats.enCours'), value: stats.commandesEnCours, badge: '', badgeType: 'info', icon: <ClipboardClock size={22} color="var(--green)" /> },
    { label: t('stats.actifsTransp'), value: stats.transporteursActifs, badge: '', badgeType: 'success', icon: <Truck size={22} color="var(--green)" /> },
    { label: t('stats.livreesCompletes'), value: stats.livraisonsCompletes, badge: '', badgeType: 'success', icon: <CircleCheckBig size={22} color="var(--green)" /> },
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
              key={item.key}
              className={`nav-item ${effectiveActive === item.key ? 'nav-item--active' : ''}`}
              onClick={() => setActive(item.key)}
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
            <button className="icon-btn logout-btn" onClick={handleLogout} title={t('common.logout')}>
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-right">
            {effectiveActive === 'Gestion des agriculteurs' && (
              <button className="btn-add-agri" onClick={() => setAgriModalOpen(true)}>{t('topbar.addAgri')}</button>
            )}
            {effectiveActive === 'Gestion des transporteurs' && (
              <button className="btn-add-agri" onClick={() => setTransModalOpen(true)}>{t('topbar.addTransp')}</button>
            )}
            <LanguageSwitcher />
            <button className="icon-btn"><Bell size={16} /></button>
            <button className="icon-btn"><Settings size={16} /></button>
          </div>
        </header>

        {effectiveActive === 'Gestion des administrateurs' && <AdminManagementPage />}
        {effectiveActive === 'Gestion des agriculteurs' && <AgriculteurPage isModalOpen={agriModalOpen} onCloseModal={() => setAgriModalOpen(false)} showArchived={agriShowArchived} />}
        {effectiveActive === 'Gestion des transporteurs' && <TransporteurPage isModalOpen={transModalOpen} onCloseModal={() => setTransModalOpen(false)} showArchived={transShowArchived} />}

        {effectiveActive === 'Dashboard' && (
          <div className="dashboard">
            <div className="dashboard-hero">
              <h1 className="dashboard-title">{t('dashboard.title')}</h1>
              <p className="dashboard-sub">{t('dashboard.sub')}</p>
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
                    <span>{t('dashPanel.recentCommandes')}</span>
                    <button className="link-btn">{t('dashPanel.viewAll')}</button>
                  </div>
                  {loading ? (
                    <div className="panel-empty">
                      <Loader size={28} color="var(--text-dim)" />
                      <span>{t('common.loading')}</span>
                    </div>
                  ) : commandes.length === 0 ? (
                    <div className="panel-empty">
                      <ClipboardList size={28} color="var(--text-dim)" />
                      <span>{t('dashPanel.noCommandes')}</span>
                    </div>
                  ) : (
                    <table className="cmd-table">
                      <thead>
                        <tr>
                          <th>{t('dashPanel.thId')}</th>
                          <th>{t('dashPanel.thAgri')}</th>
                          <th>{t('dashPanel.thProduit')}</th>
                          <th>{t('dashPanel.thStatut')}</th>
                          <th>{t('dashPanel.thDate')}</th>
                          <th>{t('dashPanel.thPrix')}</th>
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
                    <span>{t('dashPanel.recentRoutes')}</span>
                  </div>
                  {loading ? (
                    <div className="panel-empty">
                      <Loader size={28} color="var(--text-dim)" />
                      <span>{t('common.loading')}</span>
                    </div>
                  ) : routes.length === 0 ? (
                    <div className="panel-empty">
                      <Map size={28} color="var(--text-dim)" />
                      <span>{t('dashPanel.noRoutes')}</span>
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
                  <span>{t('dashPanel.recentActivity')}</span>
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
                          {c.statut === 'livree' ? t('dashPanel.actLivree') :
                            c.statut === 'en_transport' ? t('dashPanel.actEnTransport') :
                              c.statut === 'recuperee' ? t('dashPanel.actRecuperee') :
                                c.statut === 'assignee' ? t('dashPanel.actAssignee') :
                                  t('dashPanel.actEnAttente')}
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
                      <span>{t('dashPanel.noActivity')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {effectiveActive === 'Gestion des routes' && <RoutePage />}
        {effectiveActive === 'Gestion des commandes' && <CommandesPage />}
      </main>
    </div>
  )
}

export default App