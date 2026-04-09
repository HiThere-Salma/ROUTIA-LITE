import { useState } from 'react'

const transporteurs = [
  {
    id: '1', trId: '#TR-8821', nom: 'Amrani', prenom: 'Karim', cin: 'BH625143',
    tel: '06 61 22 33 44', email: 'k.amrani@email.com',
    permis: true, assurance: true, visite: true,
    adresse: '122 Bd Zerktouni, Casa...',
  },
  {
    id: '2', trId: '#TR-7742', nom: 'Zitouni', prenom: 'Youssef', cin: 'AE998012',
    tel: '06 70 88 99 00', email: 'y.zitouni@workmail.ma',
    permis: true, assurance: false, visite: true,
    adresse: 'Lot El Menzeh n°45, M...',
  },
  {
    id: '3', trId: '#TR-9910', nom: 'Lahlou', prenom: 'Sofia', cin: 'C452319',
    tel: '06 55 11 22 33', email: 's.lahlou@ltransport.com',
    permis: true, assurance: true, visite: false,
    adresse: 'Rue de la Gare, Tanger',
  },
  {
    id: '4', trId: '#TR-2234', nom: 'Bennani', prenom: 'Omar', cin: 'K009123',
    tel: '06 11 00 11 22', email: 'omar.benn@express.ma',
    permis: true, assurance: true, visite: true,
    adresse: 'Quartier Industriel, Aga...',
  },
  {
    id: '5', trId: '#TR-5501', nom: 'Chraibi', prenom: 'Leila', cin: 'WA334455',
    tel: '06 62 44 55 66', email: 'l.chraibi@translog.ma',
    permis: true, assurance: true, visite: true,
    adresse: 'Avenue Hassan II, Fès',
  },
  {
    id: '6', trId: '#TR-4418', nom: 'Moussaoui', prenom: 'Tarik', cin: 'JB778899',
    tel: '06 60 11 33 44', email: 't.moussaoui@express.ma',
    permis: false, assurance: true, visite: true,
    adresse: 'Douar Hajjaj, Meknès',
  },
  {
    id: '7', trId: '#TR-3307', nom: 'Berrada', prenom: 'Samira', cin: 'CD556677',
    tel: '06 63 22 44 55', email: 's.berrada@cargo.ma',
    permis: true, assurance: true, visite: true,
    adresse: 'Km 3, Route de Rabat',
  },
  {
    id: '8', trId: '#TR-1190', nom: 'Ennaji', prenom: 'Mehdi', cin: 'EE112233',
    tel: '06 64 55 66 77', email: 'm.ennaji@transma.net',
    permis: true, assurance: false, visite: false,
    adresse: 'Quartier Al Amal, Oujda',
  },
]

const AVATAR_COLORS = [
  { bg: '#1a2a3a', color: '#60a5fa' },
  { bg: '#14281e', color: '#4ade80' },
  { bg: '#2a1a28', color: '#d8b4fe' },
  { bg: '#2a2010', color: '#fbbf24' },
  { bg: '#1e2a1a', color: '#86efac' },
  { bg: '#1a2a2a', color: '#34d399' },
]

function DocBadge({ label, valid }: { label: string; valid: boolean }) {
  return (
    <div className="tr-doc-badge">
      <span className="tr-doc-label">{label}</span>
      <span className={`tr-doc-icon ${valid ? 'tr-doc-icon--ok' : 'tr-doc-icon--ko'}`}>
        {valid ? '✓' : '✕'}
      </span>
    </div>
  )
}

export default function TransporteurPage() {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = 42

  return (
    <div className="tr-page">
      <div className="dashboard-hero">
        <h1 className="dashboard-title">Gestion des transporteurs</h1>
        <p className="dashboard-sub">Visualisez et gérez l'ensemble des prestataires logistiques enregistrés sur la plateforme.</p>
      </div>

      <div className="tr-table-wrap">
        <table className="tr-table">
          <thead>
            <tr>
              <th>Nom &amp; Prénom</th>
              <th>CIN</th>
              <th>Contact</th>
              <th>Documents</th>
              <th>Adresse</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transporteurs.map((t) => {
              const initials = `${t.nom[0]}${t.prenom[0]}`
              const palette = AVATAR_COLORS[(t.nom.charCodeAt(0) + t.nom.charCodeAt(t.nom.length - 1)) % AVATAR_COLORS.length]
              return (
                <tr key={t.id}>
                  <td>
                    <div className="tr-name-cell">
                      <span className="tr-avatar" style={{ background: palette.bg, color: palette.color }}>{initials}</span>
                      <div className="tr-name-info">
                        <span className="tr-fullname">{t.nom} {t.prenom}</span>
                        <span className="tr-id">ID: {t.trId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="tr-mono">{t.cin}</td>
                  <td>
                    <div className="tr-contact">
                      <span className="tr-tel">{t.tel}</span>
                      <span className="tr-email">{t.email}</span>
                    </div>
                  </td>
                  <td>
                    <div className="tr-docs">
                      <DocBadge label="PERMIS" valid={t.permis} />
                      <DocBadge label="ASSUR." valid={t.assurance} />
                      <DocBadge label="VISITE" valid={t.visite} />
                    </div>
                  </td>
                  <td className="tr-adresse">{t.adresse}</td>
                  <td>
                    <div className="agri-actions">
                      <button className="agri-action-btn" title="Modifier">✎</button>
                      <button className="agri-action-btn agri-action-btn--del" title="Supprimer">🗑</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        <div className="tr-footer">
          <div className="tr-footer-left">
            <span className="tr-sync-dot" />
            <span className="tr-sync-label">BASE DE DONNÉES SYNCHRONISÉE</span>
            <span className="tr-sync-time">Mis à jour il y a 2 min</span>
          </div>
          <div className="tr-footer-right">
            <button className="tr-footer-btn">EXPORTER EN CSV</button>
            <button className="tr-footer-btn">RAPPORT MENSUEL</button>
          </div>
        </div>
      </div>

      <div className="tr-pagination">
        <span className="agri-pag-info">Affichage de 1-{transporteurs.length} sur 1&nbsp;284</span>
        <div className="agri-pag-pages">
          <button className="page-btn" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>‹</button>
          {[1, 2, 3].map((p) => (
            <button key={p} className={`page-btn${currentPage === p ? ' page-btn--active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
          ))}
          <span className="tr-ellipsis">…</span>
          <button className={`page-btn${currentPage === totalPages ? ' page-btn--active' : ''}`} onClick={() => setCurrentPage(totalPages)}>{totalPages}</button>
          <button className="page-btn" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>›</button>
        </div>
      </div>
    </div>
  )
}
