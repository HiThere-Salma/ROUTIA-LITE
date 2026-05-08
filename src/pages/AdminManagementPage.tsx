import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Mail, Phone, Search, Shield, UserPlus, X } from 'lucide-react'

type AdminRow = {
  id: string
  nom: string
  prenom: string
  email: string
  tel: string
  role: string
  statut: 'Actif' | 'Invitation envoyee'
}

const initialAdmins: AdminRow[] = [
  {
    id: 'ADM-001',
    nom: 'Bennani',
    prenom: 'Salma',
    email: 'salma.bennani@routia.ma',
    tel: '+212 661-100200',
    role: 'Super admin',
    statut: 'Actif',
  },
  {
    id: 'ADM-002',
    nom: 'El Idrissi',
    prenom: 'Yassine',
    email: 'y.elidrissi@routia.ma',
    tel: '+212 662-300400',
    role: 'Support operations',
    statut: 'Actif',
  },
  {
    id: 'ADM-003',
    nom: 'Alaoui',
    prenom: 'Nadia',
    email: 'nadia.alaoui@routia.ma',
    tel: '+212 663-450780',
    role: 'Gestion flotte',
    statut: 'Invitation envoyee',
  },
]

const EMPTY_FORM = {
  nom: '',
  prenom: '',
  email: '',
  tel: '',
  role: '',
}

export default function AdminManagementPage() {
  const { t } = useTranslation()
  const [admins, setAdmins] = useState(initialAdmins)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return admins

    return admins.filter((admin) => {
      const haystack = [admin.id, admin.nom, admin.prenom, admin.email, admin.role, admin.tel]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [admins, search])

  function closeModal() {
    setShowModal(false)
    setForm(EMPTY_FORM)
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const nextAdmin: AdminRow = {
      id: `ADM-${String(admins.length + 1).padStart(3, '0')}`,
      nom: form.nom.trim(),
      prenom: form.prenom.trim(),
      email: form.email.trim(),
      tel: form.tel.trim(),
      role: form.role.trim(),
      statut: 'Invitation envoyee',
    }

    setAdmins((current) => [nextAdmin, ...current])
    closeModal()
  }

  return (
    <div className="admin-page">
      <div className="admin-hero">
        <div>
          <h1 className="dashboard-title">{t('admins.title')}</h1>
          <p className="dashboard-sub">{t('adminPage.heroSub')}</p>
        </div>
        <button className="btn-add-agri" onClick={() => setShowModal(true)}>
          <UserPlus size={16} />
          {t('adminPage.addBtn')}
        </button>
      </div>

      <div className="admin-summary-grid">
        <div className="admin-summary-card">
          <span className="admin-summary-label">{t('adminPage.cardActifs')}</span>
          <strong className="admin-summary-value">{admins.filter((admin) => admin.statut === 'Actif').length}</strong>
        </div>
        <div className="admin-summary-card">
          <span className="admin-summary-label">{t('adminPage.cardPending')}</span>
          <strong className="admin-summary-value">{admins.filter((admin) => admin.statut === 'Invitation envoyee').length}</strong>
        </div>
        <div className="admin-summary-card">
          <span className="admin-summary-label">{t('adminPage.cardRoles')}</span>
          <strong className="admin-summary-value">{new Set(admins.map((admin) => admin.role)).size}</strong>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input
            type="search"
            placeholder={t('adminPage.searchPlaceholder')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <span className="agri-toolbar-updated">{filteredAdmins.length} {t('adminPage.results')}</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>{t('adminPage.thAdministrateur')}</th>
              <th>{t('adminPage.thContact')}</th>
              <th>{t('adminPage.thRole')}</th>
              <th>{t('routePage.thStatut')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((admin) => {
              const initials = `${admin.prenom[0]}${admin.nom[0]}`

              return (
                <tr key={admin.id}>
                  <td>
                    <div className="admin-name-cell">
                      <span className="admin-avatar">{initials}</span>
                      <div className="admin-name-info">
                        <span className="admin-fullname">{admin.prenom} {admin.nom}</span>
                        <span className="admin-id">{admin.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="admin-contact-stack">
                      <span><Mail size={14} /> {admin.email}</span>
                      <span><Phone size={14} /> {admin.tel}</span>
                    </div>
                  </td>
                  <td>
                    <span className="admin-role-pill">
                      <Shield size={14} />
                      {admin.role}
                    </span>
                  </td>
                  <td>
                    <span className={`admin-status admin-status--${admin.statut === 'Actif' ? 'active' : 'pending'}`}>
                      {admin.statut === 'Actif' ? t('adminPage.statutActif') : t('adminPage.statutInvite')}
                    </span>
                  </td>
                </tr>
              )
            })}
            {filteredAdmins.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="panel-empty">
                    <Shield size={28} color="var(--text-dim)" />
                    <span>{t('adminPage.noResults')}</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="admin-modal-backdrop" onClick={closeModal}>
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <h2>{t('adminPage.modalTitle')}</h2>
                <p>{t('adminPage.modalSub')}</p>
              </div>
              <button className="icon-btn" onClick={closeModal} title={t('common.close')}>
                <X size={16} />
              </button>
            </div>

            <form className="admin-form" onSubmit={handleSubmit}>
              <label>
                {t('adminPage.labelPrenom')}
                <input
                  type="text"
                  value={form.prenom}
                  onChange={(event) => setForm((current) => ({ ...current, prenom: event.target.value }))}
                  required
                />
              </label>
              <label>
                {t('adminPage.labelNom')}
                <input
                  type="text"
                  value={form.nom}
                  onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))}
                  required
                />
              </label>
              <label>
                {t('adminPage.labelEmail')}
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </label>
              <label>
                {t('adminPage.labelTel')}
                <input
                  type="tel"
                  value={form.tel}
                  onChange={(event) => setForm((current) => ({ ...current, tel: event.target.value }))}
                  required
                />
              </label>
              <label className="admin-form-full">
                {t('adminPage.labelRole')}
                <input
                  type="text"
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value }))}
                  placeholder={t('adminPage.rolePlaceholder')}
                  required
                />
              </label>

              <div className="admin-form-actions admin-form-full">
                <button type="button" className="agri-btn-outline" onClick={closeModal}>{t('common.cancel')}</button>
                <button type="submit" className="btn-add-agri">{t('adminPage.btnCreate')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}