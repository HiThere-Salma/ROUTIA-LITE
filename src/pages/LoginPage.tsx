import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Loader, Mail, Lock, Truck, MapPin, Package, ArrowRight } from 'lucide-react'
import LanguageSwitcher from '../components/LanguageSwitcher'

type LoginPageProps = {
  onSubmit: (email: string, password: string) => void
  error: string
  loading: boolean
}

export default function LoginPage({ onSubmit, error, loading }: LoginPageProps) {
  const { t } = useTranslation()
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

          <h1 className="login-brand-title">{t('login.tagline')}</h1>
          <p className="login-brand-desc">{t('login.desc')}</p>

          <div className="login-features">
            <div className="login-feature">
              <div className="login-feature-icon"><Truck size={18} /></div>
              <span>{t('login.feature1')}</span>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon"><MapPin size={18} /></div>
              <span>{t('login.feature2')}</span>
            </div>
            <div className="login-feature">
              <div className="login-feature-icon"><Package size={18} /></div>
              <span>{t('login.feature3')}</span>
            </div>
          </div>
        </div>

        <div className="login-brand-footer">
          <span>{t('login.footer')}</span>
        </div>
      </div>

      {/* Right form panel */}
      <div className="login-form-panel">
        <div className="login-lang-switcher">
          <LanguageSwitcher />
        </div>
        <div className="login-card">
          <div className="login-card-badge">{t('login.badge')}</div>

          <h2 className="login-title">{t('login.welcome')}</h2>
          <p className="login-subtitle">{t('login.subtitle')}</p>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label htmlFor="email">{t('login.emailLabel')}</label>
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
              <label htmlFor="password">{t('login.passwordLabel')}</label>
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
                  {t('login.submit')}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer-text">
            {t('login.accessNote')}
          </div>
        </div>
      </div>
    </div>
  )
}
