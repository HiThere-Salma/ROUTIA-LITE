import type { FormEvent } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Loader, Mail, MapPin, Phone, Search, Shield, UserPlus, X } from 'lucide-react'
import AddressAutocompleteInput from '../components/AddressAutocompleteInput'
import { getSupabaseClient } from '../lib/supabase'

type CurrentAdmin = {
  id: string
  issuper?: boolean | null
}

type AdminRow = {
  id: string
  nom: string | null
  nom_complet?: string | null
  prenom: string | null
  email: string
  numero_tel: string | null
  adresse: string | null
  issuper: boolean | null
}

type AdminForm = {
  nom: string
  prenom: string
  email: string
  tel: string
  adresse: string
  password: string
}

const EMPTY_FORM: AdminForm = {
  nom: '',
  prenom: '',
  email: '',
  tel: '',
  adresse: '',
  password: '',
}

type AdminManagementPageProps = {
  currentAdmin: CurrentAdmin
}

function mapSignupErrorMessage(rawMessage: string) {
  const msg = rawMessage.toLowerCase()

  if (msg.includes('user already registered')) {
    return 'Cet email est déjà utilisé. Choisissez un autre email.'
  }

  if (msg.includes('signups not allowed')) {
    return "Les inscriptions sont désactivées dans Supabase (Auth > Providers > Email)."
  }

  if (msg.includes('password')) {
    return 'Mot de passe invalide. Utilisez au moins 6 caractères (8 recommandé).'
  }

  if (msg.includes('email')) {
    return 'Email invalide. Vérifiez le format saisi.'
  }

  return `Erreur de création du compte: ${rawMessage}`
}

function mapAdminInsertErrorMessage(rawMessage: string) {
  const msg = rawMessage.toLowerCase()

  if (msg.includes('row-level security')) {
    return "Insertion refusée par les règles RLS de la table admin."
  }

  if (msg.includes('invalid input syntax') && msg.includes('id')) {
    return "Le champ id de la table admin n'accepte pas l'UUID Auth."
  }

  if (msg.includes('duplicate key') || msg.includes('unique')) {
    return "Un admin avec cet email (ou identifiant) existe déjà dans la table admin."
  }

  return `Insertion admin échouée: ${rawMessage}`
}

export default function AdminManagementPage({ currentAdmin }: AdminManagementPageProps) {
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function fetchAdmins() {
    setLoading(true)
    setError('')
    const supabase = getSupabaseClient()
    const { data, error: fetchError } = await supabase
      .from('admin')
      .select('*')

    if (fetchError) {
      setError(`Impossible de charger la liste des administrateurs: ${fetchError.message}`)
      setLoading(false)
      return
    }

    setAdmins((data as AdminRow[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    async function load() { await fetchAdmins() }
    void load()
  }, [])

  const filteredAdmins = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return admins

    return admins.filter((admin) => {
      const roleLabel = admin.issuper ? 'Super admin' : 'Admin'
      const lastName = admin.nom ?? admin.nom_complet ?? ''
      const haystack = [admin.id, lastName, admin.prenom ?? '', admin.email, roleLabel, admin.numero_tel ?? '', admin.adresse ?? '']
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [admins, search])

  function closeModal() {
    setShowModal(false)
    setForm(EMPTY_FORM)
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!currentAdmin.issuper) {
      setError("Seul le super admin peut créer des administrateurs.")
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const supabase = getSupabaseClient()
      const { data: sessionData } = await supabase.auth.getSession()
      const creatorSession = sessionData.session

      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: form.email.trim(),
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      })

      if (signupError || !signupData.user) {
        setError(mapSignupErrorMessage(signupError?.message ?? "Impossible de créer le compte d'authentification."))
        setSubmitting(false)
        return
      }

      if (creatorSession) {
        const { error: restoreSessionError } = await supabase.auth.setSession({
          access_token: creatorSession.access_token,
          refresh_token: creatorSession.refresh_token,
        })

        if (restoreSessionError) {
          setError("Le compte a été créé, mais la session du super admin n'a pas pu être restaurée automatiquement.")
          setSubmitting(false)
          return
        }
      }

      const baseAdminPayload = {
        prenom: form.prenom.trim(),
        nom: form.nom.trim(),
        email: form.email.trim(),
        numero_tel: form.tel.trim(),
        adresse: form.adresse.trim(),
        issuper: false,
      }

      let { error: insertError } = await supabase.from('admin').insert({
        id: signupData.user.id,
        ...baseAdminPayload,
      })

      // Fallback for schemas where admin.id is auto-generated (integer/bigint) instead of UUID.
      if (insertError?.message.toLowerCase().includes('id')) {
        const retry = await supabase.from('admin').insert(baseAdminPayload)
        insertError = retry.error
      }

      if (insertError) {
        setError(mapAdminInsertErrorMessage(insertError.message))
        setSubmitting(false)
        return
      }

      await fetchAdmins()
      closeModal()
    } finally {
      setSubmitting(false)
    }
  }

  if (!currentAdmin.issuper) {
    return (
      <div className="placeholder-page">
        <div className="placeholder-icon"><Shield size={36} color="var(--border)" /></div>
        <p className="placeholder-title">Accès refusé</p>
        <p className="placeholder-sub">Cette page est réservée au super admin (issuper = true).</p>
      </div>
    )
  }

  return (
    <div className="admin-page">
      <div className="admin-hero">
        <div>
          <h1 className="dashboard-title">Gestion des administrateurs</h1>
          <p className="dashboard-sub">Le super admin peut créer des comptes admin. La connexion est possible apres verification email.</p>
        </div>
        <button className="btn-add-agri" onClick={() => setShowModal(true)}>
          <UserPlus size={16} />
          Ajouter un administrateur
        </button>
      </div>

      <div className="admin-summary-grid">
        <div className="admin-summary-card">
          <span className="admin-summary-label">Administrateurs</span>
          <strong className="admin-summary-value">{admins.length}</strong>
        </div>
        <div className="admin-summary-card">
          <span className="admin-summary-label">Super admins</span>
          <strong className="admin-summary-value">{admins.filter((admin) => admin.issuper).length}</strong>
        </div>
        <div className="admin-summary-card">
          <span className="admin-summary-label">Admins</span>
          <strong className="admin-summary-value">{admins.filter((admin) => !admin.issuper).length}</strong>
        </div>
      </div>

      <div className="admin-toolbar">
        <div className="admin-search">
          <Search size={16} />
          <input
            type="search"
            placeholder="Rechercher un administrateur"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <span className="agri-toolbar-updated">{filteredAdmins.length} resultat(s)</span>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Administrateur</th>
              <th>Contact</th>
              <th>Adresse</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4}>
                  <div className="panel-empty">
                    <Loader size={28} color="var(--text-dim)" />
                    <span>Chargement...</span>
                  </div>
                </td>
              </tr>
            )}
            {filteredAdmins.map((admin) => {
              const first = (admin.prenom ?? '').trim()
              const last = (admin.nom ?? admin.nom_complet ?? '').trim()
              const initials = `${first[0] ?? 'A'}${last[0] ?? 'D'}`
              const roleLabel = admin.issuper ? 'Super admin' : 'Admin'

              return (
                <tr key={admin.id}>
                  <td>
                    <div className="admin-name-cell">
                      <span className="admin-avatar">{initials}</span>
                      <div className="admin-name-info">
                        <span className="admin-fullname">{admin.prenom} {admin.nom ?? admin.nom_complet}</span>
                        <span className="admin-id">{admin.id}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="admin-contact-stack">
                      <span><Mail size={14} /> {admin.email}</span>
                      <span><Phone size={14} /> {admin.numero_tel}</span>
                    </div>
                  </td>
                  <td>
                    <span className="admin-address-cell">
                      <MapPin size={14} />
                      {admin.adresse || 'Adresse non renseignée'}
                    </span>
                  </td>
                  <td>
                    <span className="admin-role-pill">
                      <Shield size={14} />
                      {roleLabel}
                    </span>
                  </td>
                </tr>
              )
            })}
            {!loading && filteredAdmins.length === 0 && (
              <tr>
                <td colSpan={4}>
                  <div className="panel-empty">
                    <Shield size={28} color="var(--text-dim)" />
                    <span>Aucun administrateur ne correspond a votre recherche</span>
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
                <h2>Ajouter un administrateur</h2>
                <p>Créer un compte admin avec email et mot de passe.</p>
              </div>
              <button className="icon-btn" onClick={closeModal} title="Fermer">
                <X size={16} />
              </button>
            </div>

            {error && <div className="login-error">{error}</div>}

            <form className="admin-form" onSubmit={handleSubmit}>
              <label>
                Prenom
                <input
                  type="text"
                  value={form.prenom}
                  onChange={(event) => setForm((current) => ({ ...current, prenom: event.target.value }))}
                  required
                />
              </label>
              <label>
                Nom
                <input
                  type="text"
                  value={form.nom}
                  onChange={(event) => setForm((current) => ({ ...current, nom: event.target.value }))}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  required
                />
              </label>
              <label>
                Telephone
                <input
                  type="tel"
                  value={form.tel}
                  onChange={(event) => setForm((current) => ({ ...current, tel: event.target.value }))}
                  required
                />
              </label>
              <label>
                Adresse
                <AddressAutocompleteInput
                  value={form.adresse}
                  onChange={(value) => setForm((current) => ({ ...current, adresse: value }))}
                  placeholder="Commencez a saisir une adresse..."
                  required
                />
              </label>
              <label>
                Mot de passe
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  minLength={6}
                  required
                />
              </label>

              <div className="admin-form-actions admin-form-full">
                <button type="button" className="agri-btn-outline" onClick={closeModal}>Annuler</button>
                <button type="submit" className="btn-add-agri" disabled={submitting}>
                  {submitting ? 'Création...' : "Ajouter l'administrateur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}