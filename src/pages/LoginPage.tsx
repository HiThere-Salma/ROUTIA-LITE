import { useState } from 'react'
import { Loader, Mail, Lock, Truck, MapPin, Package, ArrowRight } from 'lucide-react'

type LoginPageProps = {
  onSubmit: (email: string, password: string) => void
  error: string
  loading: boolean
}

export default function LoginPage({ onSubmit, error, loading }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(email, password)
  }

  return (
    <div className="login-page">
      {/* Left branding panel */}
      <div className="login-brand">
        <div className="login-brand-bg">
          <div className="login-grid-line login-grid-line--1" />
          <div className="login-grid-line login-grid-line--2" />
          <div className="login-grid-line login-grid-line--3" />
          <div className="login-orb login-orb--1" />
          <div className="login-orb login-orb--2" />
        </div>

        <div className="login-brand-content">
          <div className="login-brand-logo">
            <span className="logo-text">ROUTIA</span>
            <span className="logo-sub">COMMAND CENTER</span>
          </div>

          <h1 className="login-brand-title">Gestion logistique<br />intelligente</h1>
          <p className="login-brand-desc">
            Optimisez vos routes, gérez vos transporteurs et suivez vos commandes en temps réel.
          </p>

          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-icon"><Truck size={18} /></div>
              <span>Suivi des transporteurs</span>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon"><MapPin size={18} /></div>
              <span>Optimisation des routes</span>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon"><Package size={18} /></div>
              <span>Gestion des commandes</span>
            </div>
          </div>
        </div>

        <div className="login-brand-footer">
          <span>© 2026 Routia — Tous droits réservés</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-form-panel">
        <div className="login-card">
          <div className="login-card-badge">Admin</div>

          <h2 className="login-title">Bon retour !</h2>
          <p className="login-subtitle">Connectez-vous pour accéder au tableau de bord.</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">Adresse email</label>
              <div className="login-input-wrap">
                <Mail size={16} className="login-input-icon" />
                <input
                  id="email"
                  type="email"
                  placeholder="admin@routia.ma"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="password">Mot de passe</label>
              <div className="login-input-wrap">
                <Lock size={16} className="login-input-icon" />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <Loader size={16} className="login-spinner" />
              ) : (
                <>
                  Se connecter
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer-text">
            Accès réservé aux administrateurs Routia
          </div>
        </div>
      </div>
    </div>
  )
}
