import './App.css'
import { useState, useEffect, useRef } from 'react'
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
import {
  fetchAdminNotificationHistory,
  fetchUnreadAdminNotifications,
  fetchUnreadNotificationsCount,
  markNotificationAsRead,
  markNotificationsAsRead,
  type AdminNotification,
} from './lib/notifications'

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

type AppTheme = 'dark' | 'light'

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



function App() {
  const { t } = useTranslation()
  const notificationsRef = useRef<HTMLDivElement>(null)
  const settingsRef = useRef<HTMLDivElement>(null)
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
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0)
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [notificationsError, setNotificationsError] = useState('')
  const [notificationHistory, setNotificationHistory] = useState<AdminNotification[]>([])
  const [notificationHistoryLoading, setNotificationHistoryLoading] = useState(false)
  const [notificationHistoryError, setNotificationHistoryError] = useState('')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [theme, setTheme] = useState<AppTheme>(() => {
    const storedTheme = localStorage.getItem('routia-theme')
    return storedTheme === 'light' ? 'light' : 'dark'
  })
  const navItems = [
    { key: 'Dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard size={16} /> },
    ...(admin?.issuper ? [{ key: 'Gestion des administrateurs', label: t('nav.admins'), icon: <ShieldCheck size={16} /> }] : []),
    { key: 'Gestion des transporteurs', label: t('nav.transporteurs'), icon: <Truck size={16} /> },
    { key: 'Gestion des agriculteurs', label: t('nav.agriculteurs'), icon: <Sprout size={16} /> },
    { key: 'Gestion des routes', label: t('nav.routes'), icon: <Map size={16} /> },
    { key: 'Gestion des commandes', label: t('nav.commandes'), icon: <ClipboardList size={16} /> },
  ]

  const effectiveActive = (!admin?.issuper && active === 'Gestion des administrateurs') ? 'Dashboard' : active
  const adminDisplayName = [admin?.prenom, admin?.nom_complet ?? admin?.nom].filter(Boolean).join(' ') || 'Administrateur'
  const adminRole = admin?.issuper ? 'Super admin' : 'Admin'

  async function loadNotifications() {
    setNotificationsLoading(true)
    setNotificationsError('')
    try {
      const [items, unreadCount] = await Promise.all([
        fetchUnreadAdminNotifications(),
        fetchUnreadNotificationsCount(),
      ])
      setNotifications(items)
      setUnreadNotificationsCount(unreadCount)
    } catch (err) {
      console.error('Erreur chargement notifications:', err)
      setNotificationsError('Impossible de charger les notifications.')
    } finally {
      setNotificationsLoading(false)
    }
  }

  async function loadNotificationHistory() {
    setNotificationHistoryLoading(true)
    setNotificationHistoryError('')
    try {
      const items = await fetchAdminNotificationHistory()
      setNotificationHistory(items)
    } catch (err) {
      console.error('Erreur historique notifications:', err)
      setNotificationHistoryError("Impossible de charger l'historique des notifications.")
    } finally {
      setNotificationHistoryLoading(false)
    }
  }

  function formatNotificationDate(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  async function handleToggleNotifications() {
    const nextOpen = !notificationsOpen
    setNotificationsOpen(nextOpen)
    setSettingsOpen(false)
    if (nextOpen) await loadNotifications()
  }

  async function handleMarkNotificationsAsRead() {
    try {
      await markNotificationsAsRead()
      await loadNotifications()
      if (effectiveActive === 'Notifications') await loadNotificationHistory()
    } catch (err) {
      console.error('Erreur lecture notifications:', err)
      setNotificationsError('Impossible de marquer les notifications comme lues.')
    }
  }

  function isNotificationClickable(notification: AdminNotification) {
    return Boolean(
      notification.entity_id &&
      (notification.entity_type === 'route' || notification.entity_type === 'commande'),
    )
  }

  async function handleNotificationClick(notification: AdminNotification) {
    if (!isNotificationClickable(notification)) return

    try {
      await markNotificationAsRead(notification.id)
      await loadNotifications()
      if (effectiveActive === 'Notifications') await loadNotificationHistory()
    } catch (err) {
      console.error('Erreur lecture notification:', err)
    }

    setNotificationsOpen(false)
    const entityId = String(notification.entity_id)
    const view = notification.entity_type === 'route' ? 'routes' : 'commandes'
    window.history.replaceState(null, '', `?view=${view}&highlight=${encodeURIComponent(entityId)}`)
    setActive(notification.entity_type === 'route' ? 'Gestion des routes' : 'Gestion des commandes')
  }

  function handleOpenNotificationHistory() {
    setNotificationsOpen(false)
    setSettingsOpen(false)
    setActive('Notifications')
    window.history.replaceState(null, '', '?view=notifications')
    loadNotificationHistory()
  }

  useEffect(() => {
    document.documentElement.classList.remove('theme-dark', 'theme-light')
    document.documentElement.classList.add(`theme-${theme}`)
    localStorage.setItem('routia-theme', theme)
  }, [theme])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (notificationsRef.current && !notificationsRef.current.contains(target)) {
        setNotificationsOpen(false)
      }
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setSettingsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!admin) return

    loadNotifications()

    const channel = getSupabaseClient()
      .channel('admin-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: 'target_role=eq.admin',
        },
        () => {
          loadNotifications()
          if (effectiveActive === 'Notifications') loadNotificationHistory()
        },
      )
      .subscribe()

    return () => {
      getSupabaseClient().removeChannel(channel)
    }
  }, [admin, effectiveActive])

  useEffect(() => {
    if (!admin || effectiveActive !== 'Notifications') return
    loadNotificationHistory()
  }, [admin, effectiveActive])

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
        setLoginError(t('login.errorCredentials'))
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
        setLoginError(t('login.errorNoAdmin'))
        setLoginLoading(false)
        return
      }
      setAdmin(adminData as Admin)
    } catch {
      setLoginError(t('login.errorGeneric'))
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
            <div className="header-action" ref={notificationsRef}>
              <button
                className={`icon-btn${notificationsOpen ? ' icon-btn--active' : ''}`}
                onClick={handleToggleNotifications}
                aria-haspopup="menu"
                aria-expanded={notificationsOpen}
                title="Notifications"
              >
                <Bell size={16} />
                {unreadNotificationsCount > 0 && (
                  <span className="notification-badge">{unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}</span>
                )}
              </button>
              {notificationsOpen && (
                <div className="header-dropdown header-dropdown--notifications" role="menu">
                  <div className="header-dropdown-head">
                    <div className="header-dropdown-title">Notifications</div>
                    {unreadNotificationsCount > 0 && (
                      <button className="notifications-read-all" onClick={handleMarkNotificationsAsRead}>
                        Tout marquer comme lu
                      </button>
                    )}
                  </div>
                  {notificationsLoading ? (
                    <div className="header-dropdown-empty">Chargement...</div>
                  ) : notificationsError ? (
                    <div className="header-dropdown-empty header-dropdown-empty--error">{notificationsError}</div>
                  ) : notifications.length === 0 ? (
                    <div className="header-dropdown-empty">Aucune notification récente</div>
                  ) : (
                    <div className="notification-list">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`notification-item${notification.is_read ? '' : ' notification-item--unread'}${isNotificationClickable(notification) ? ' notification-item--clickable' : ''}`}
                          onClick={() => handleNotificationClick(notification)}
                          role={isNotificationClickable(notification) ? 'button' : undefined}
                          tabIndex={isNotificationClickable(notification) ? 0 : undefined}
                          onKeyDown={(event) => {
                            if (isNotificationClickable(notification) && (event.key === 'Enter' || event.key === ' ')) {
                              event.preventDefault()
                              handleNotificationClick(notification)
                            }
                          }}
                        >
                          <div className="notification-meta">
                            <span>{notification.type}</span>
                            <span>{formatNotificationDate(notification.created_at)}</span>
                          </div>
                          <div className="notification-title">{notification.title}</div>
                          <div className="notification-message">{notification.message}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <button className="notifications-history-link" onClick={handleOpenNotificationHistory}>
                    Voir l'historique
                  </button>
                </div>
              )}
            </div>
            <div className="header-action" ref={settingsRef}>
              <button
                className={`icon-btn${settingsOpen ? ' icon-btn--active' : ''}`}
                onClick={() => {
                  setSettingsOpen((open) => !open)
                  setNotificationsOpen(false)
                }}
                aria-haspopup="menu"
                aria-expanded={settingsOpen}
                title="Paramètres"
              >
                <Settings size={16} />
              </button>
              {settingsOpen && (
                <div className="header-dropdown header-dropdown--settings" role="menu">
                  <div className="header-dropdown-title">Paramètres</div>

                  <section className="settings-section">
                    <div className="settings-section-title">Compte</div>
                    <div className="settings-account">
                      <div className="settings-account-avatar">{admin.prenom?.[0] ?? admin.email[0]?.toUpperCase() ?? 'A'}</div>
                      <div>
                        <div className="settings-account-name">{adminDisplayName}</div>
                        <div className="settings-account-email">{admin.email}</div>
                        <div className="settings-account-role">{adminRole}</div>
                      </div>
                    </div>
                  </section>

                  <section className="settings-section">
                    <div className="settings-section-title">Préférences</div>
                    <div className="settings-row">
                      <span>Thème</span>
                      <div className="theme-segment" role="group" aria-label="Choix du thème">
                        <button className={theme === 'dark' ? 'theme-segment-btn theme-segment-btn--active' : 'theme-segment-btn'} onClick={() => setTheme('dark')}>Sombre</button>
                        <button className={theme === 'light' ? 'theme-segment-btn theme-segment-btn--active' : 'theme-segment-btn'} onClick={() => setTheme('light')}>Clair</button>
                      </div>
                    </div>
                  </section>

                  <section className="settings-section">
                    <div className="settings-section-title">Actions</div>
                    <button className="settings-logout-btn" onClick={handleLogout}>
                      <LogOut size={14} />
                      <span>Se déconnecter</span>
                    </button>
                  </section>
                </div>
              )}
            </div>
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
                                {({'livree': t('dashPanel.actLivree'), 'en_transport': t('dashPanel.actEnTransport'), 'en_attente': t('dashPanel.actEnAttente'), 'assignee': t('dashPanel.actAssignee'), 'recuperee': t('dashPanel.actRecuperee')} as Record<string, string>)[c.statut] ?? c.statut}
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
        {effectiveActive === 'Notifications' && (
          <div className="notifications-page">
            <div className="notifications-page-hero">
              <h1 className="dashboard-title">Historique des notifications</h1>
              <p className="dashboard-sub">Toutes les notifications admin, lues et non lues.</p>
            </div>

            <div className="notifications-history-panel">
              {notificationHistoryLoading ? (
                <div className="panel-empty">
                  <Loader size={28} color="var(--text-dim)" />
                  <span>{t('common.loading')}</span>
                </div>
              ) : notificationHistoryError ? (
                <div className="panel-empty notifications-history-error">{notificationHistoryError}</div>
              ) : notificationHistory.length === 0 ? (
                <div className="panel-empty">Aucune notification récente</div>
              ) : (
                <div className="notifications-history-list">
                  {notificationHistory.map((notification) => (
                    <div key={notification.id} className="notifications-history-item">
                      <div className="notifications-history-main">
                        <div className="notifications-history-title">{notification.title}</div>
                        <div className="notifications-history-message">{notification.message}</div>
                      </div>
                      <div className="notifications-history-meta">
                        <span className="notifications-history-type">{notification.type}</span>
                        <span>{formatNotificationDate(notification.created_at)}</span>
                        <span className={`notifications-history-status${notification.is_read ? ' notifications-history-status--read' : ' notifications-history-status--unread'}`}>
                          {notification.is_read ? 'Lu' : 'Non lu'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
