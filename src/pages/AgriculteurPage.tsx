import { useState } from 'react'

const agriculteurs = [
  { id: '1', agId: '#AG-9921', nom: 'Amrani', prenom: 'Brahim', cin: 'JB129304', tel: '+212 661-002233', email: 'b.amrani@email.ma', adresse: "Route d'Agadir, Km 12", ville: 'TAROUDANT' },
  { id: '2', agId: '#AG-8812', nom: 'Fahmi', prenom: 'Karima', cin: 'K449201', tel: '+212 662-887766', email: 'k.fahmi@agri.ma', adresse: 'Commune El Mansouria', ville: 'BENSLIMANE' },
  { id: '3', agId: '#AG-7722', nom: 'Zahiri', prenom: 'Mohamed', cin: 'CD992812', tel: '+212 670-112233', email: 'm.zahiri@harvest.net', adresse: 'Quartier Industriel Aït Melloul', ville: 'AGADIR' },
  { id: '4', agId: '#AG-4521', nom: 'Sbai', prenom: 'Meryem', cin: 'Y293812', tel: '+212 665-443322', email: 'meryem.sbai@domain.com', adresse: 'Douar Laaslat, Commune Skhirat', ville: 'TEMARA' },
  { id: '5', agId: '#AG-3310', nom: 'Benali', prenom: 'Youssef', cin: 'BJ551122', tel: '+212 661-334455', email: 'y.benali@agri.ma', adresse: 'Douar Ouled Moussa', ville: 'SETTAT' },
  { id: '6', agId: '#AG-2980', nom: 'Ouali', prenom: 'Fatima', cin: 'HH778899', tel: '+212 664-556677', email: 'f.ouali@harvest.ma', adresse: 'Km 5, Route de Meknes', ville: 'FES' },
  { id: '7', agId: '#AG-2741', nom: 'Rachid', prenom: 'Omar', cin: 'GH223344', tel: '+212 671-889900', email: 'o.rachid@agri.net', adresse: 'Commune Rurale Sidi Youssef', ville: 'MARRAKECH' },
  { id: '8', agId: '#AG-2530', nom: 'Haddou', prenom: 'Nadia', cin: 'TJ445566', tel: '+212 662-001122', email: 'n.haddou@email.ma', adresse: 'Quartier Al Massira', ville: 'OUJDA' },
  { id: '9', agId: '#AG-2211', nom: 'Tazi', prenom: 'Hassan', cin: 'EC667788', tel: '+212 667-223344', email: 'h.tazi@harvest.net', adresse: 'Route de Casablanca, Km 22', ville: 'RABAT' },
  { id: '10', agId: '#AG-1990', nom: 'Mansouri', prenom: 'Zineb', cin: 'AA990011', tel: '+212 663-445566', email: 'z.mansouri@agri.ma', adresse: 'Douar Ait Benhmed', ville: 'KHOURIBGA' },
]

const AVATAR_COLORS = [
  { bg: '#14281e', color: '#4ade80' },
  { bg: '#1a2030', color: '#60a5fa' },
  { bg: '#2a1a28', color: '#d8b4fe' },
  { bg: '#1e2a1a', color: '#86efac' },
  { bg: '#2a2010', color: '#fbbf24' },
  { bg: '#1a2a2a', color: '#34d399' },
]

export default function AgriculteurPage() {
  const [agriPage, setAgriPage] = useState(1)

  return (
    <div className="agri-page">
      <div className="dashboard-hero">
        <h1 className="dashboard-title">Gestion des Agriculteurs</h1>
        <p className="dashboard-sub">Pilotez votre réseau de producteurs et optimisez les points de collecte.</p>
      </div>

      <div className="agri-toolbar">
        <button className="agri-btn-outline">⊟ Filtrer</button>
        <button className="agri-btn-outline">Exporter CSV</button>
        <span className="agri-toolbar-updated">MISE À JOUR IL Y A 2 MINUTES</span>
      </div>

      <div className="agri-table-wrap">
        <table className="agri-table">
          <thead>
            <tr>
              <th>Nom &amp; Prénom</th>
              <th>CIN</th>
              <th>Téléphone</th>
              <th>Email</th>
              <th>Adresse</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {agriculteurs.map((a) => {
              const initials = `${a.nom[0]}${a.prenom[0]}`
              const palette = AVATAR_COLORS[(a.nom.charCodeAt(0) + a.nom.charCodeAt(a.nom.length - 1)) % AVATAR_COLORS.length]
              return (
                <tr key={a.id}>
                  <td>
                    <div className="agri-name-cell">
                      <span className="agri-avatar" style={{ background: palette.bg, color: palette.color }}>{initials}</span>
                      <div className="agri-name-info">
                        <span className="agri-fullname">{a.nom} {a.prenom}</span>
                        <span className="agri-id">ID: {a.agId}</span>
                      </div>
                    </div>
                  </td>
                  <td className="agri-mono">{a.cin}</td>
                  <td className="agri-mono">{a.tel}</td>
                  <td className="agri-email">{a.email}</td>
                  <td>
                    <div className="agri-name-info">
                      <span className="agri-adresse">{a.adresse}</span>
                      <span className="agri-ville">{a.ville}</span>
                    </div>
                  </td>
                  <td>
                    <div className="agri-actions">
                      <button className="agri-action-btn" title="Modifier">✎</button>
                      <button className="agri-action-btn agri-action-btn--del" title="Supprimer">✕</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <div className="agri-pagination">
          <span className="agri-pag-info">Affichage de 1-10 sur 1&nbsp;284</span>
          <div className="agri-pag-pages">
            <button className="page-btn" onClick={() => setAgriPage(Math.max(1, agriPage - 1))} disabled={agriPage === 1}>‹</button>
            {[1, 2, 3].map((p) => (
              <button key={p} className={`page-btn${agriPage === p ? ' page-btn--active' : ''}`} onClick={() => setAgriPage(p)}>{p}</button>
            ))}
            <button className="page-btn" onClick={() => setAgriPage(Math.min(3, agriPage + 1))} disabled={agriPage === 3}>›</button>
          </div>
        </div>
      </div>
    </div>
  )
}
