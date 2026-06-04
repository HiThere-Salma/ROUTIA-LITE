import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Pencil, Trash2, X } from "lucide-react";
import CommandeStatusBadge from "./CommandeStatusBadge";
import type { CommandeData } from "../commandes.types";

type CommandeDetailsModalProps = {
  commande: CommandeData | null;
  commandeId: string | null;
  onClose: () => void;
  onEdit?: (commandeId: string, commande: CommandeData) => void;
  onDelete?: (commandeId: string, commande: CommandeData) => void;
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function firstNonEmpty(...values: unknown[]): string {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      return String(value);
    }
  }
  return "-";
}

function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function fullName(firstName: unknown, lastName: unknown): string {
  const first = normalizeText(firstName);
  const last = normalizeText(lastName);
  const joined = [first, last].filter(Boolean).join(" ").trim();
  return joined || "-";
}

function formatPrice(value: unknown): string {
  if (value === null || value === undefined || value === "") return "-";
  const amount = Number(value);
  if (!Number.isFinite(amount)) return formatValue(value);
  return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD" }).format(amount);
}

const STATUS_KEYS = ["statut", "status", "etat"];

export default function CommandeDetailsModal({ commande, commandeId, onClose, onEdit, onDelete }: CommandeDetailsModalProps) {
  const { t } = useTranslation()
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!commandeId || !commande) return null;

  const statusKey = STATUS_KEYS.find((k) => commande[k] !== undefined && commande[k] !== null && commande[k] !== "");
  const statusValue = statusKey ? String(commande[statusKey]) : "En attente";

  const produit = firstNonEmpty(commande.produit, commande.nature, commande.type_produit);
  const agriculteurNomComplet = fullName(
    commande.prenom_agriculteur ?? commande.agriculteur_prenom,
    commande.nom_agriculteur ?? commande.agriculteur_nom
  );
  const transporteurNomComplet = fullName(
    commande.prenom_transporteur ?? commande.transporteur_prenom,
    commande.nom_transporteur ?? commande.transporteur_nom
  );
  const agriculteur =
    agriculteurNomComplet !== "-"
      ? agriculteurNomComplet
      : firstNonEmpty(commande.agriculteur, commande.nom_complet_agriculteur, commande.agriculteur_name);
  const transporteur =
    transporteurNomComplet !== "-"
      ? transporteurNomComplet
      : firstNonEmpty(commande.transporteur, commande.nom_complet_transporteur, commande.transporteur_name);
  const routeId = firstNonEmpty(commande.route_id, commande.id_route);
  const dateCollecte = firstNonEmpty(commande.date_collecte, commande.date, commande.created_at);
  const heureLivraison = firstNonEmpty(commande.heure_livraison, commande.heure, commande.heure_collecte, commande.time);
  const adresseCollecte = firstNonEmpty(commande.adresse_collecte, commande.collecte, commande.origine);
  const adresseLivraison = firstNonEmpty(commande.adresse_livraison, commande.livraison, commande.destination);
  const distance = firstNonEmpty(
    commande.distance_estimee,
    commande.distance,
    commande.distance_km,
    commande.kilometrage,
    commande.temps_estime,
    commande.duree
  );
  const prix = formatPrice(commande.prix ?? commande.montant);
  const pickupCoords = firstNonEmpty(
    commande.pickup_lat && commande.pickup_lng ? `${commande.pickup_lat}, ${commande.pickup_lng}` : "",
    commande.latitude_collecte && commande.longitude_collecte ? `${commande.latitude_collecte}, ${commande.longitude_collecte}` : ""
  );
  const dropCoords = firstNonEmpty(
    commande.drop_lat && commande.drop_lng ? `${commande.drop_lat}, ${commande.drop_lng}` : "",
    commande.latitude_livraison && commande.longitude_livraison ? `${commande.latitude_livraison}, ${commande.longitude_livraison}` : ""
  );

  return (
    <div className="rt-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <aside className="rt-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="rt-drawer-header">
          <div>
            <h2 className="rt-drawer-title">{t('cmdModal.detailsTitle')}</h2>
            <span className="rt-drawer-subtitle">#{commandeId}</span>
          </div>
          <div className="cmd-modal-header-right">
            <CommandeStatusBadge status={statusValue} />
            <button className="rt-modal-close" onClick={onClose} type="button" aria-label={t('common.close')}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="rt-drawer-body">
            <section className="rt-detail-section">
              <h3 className="rt-detail-section-title">{t('cmdModal.sectionGeneral')}</h3>
              <div className="rt-detail-grid">
                <div className="rt-detail-item">
                  <span className="rt-detail-label">ID</span>
                  <span className="rt-detail-value rt-detail-value--mono">#{commandeId}</span>
                </div>
                <div className="rt-detail-item">
                  <span className="rt-detail-label">{t('cmdModal.produit')}</span>
                  <span className="rt-detail-value">{produit}</span>
                </div>
                <div className="rt-detail-item">
                  <span className="rt-detail-label">{t('cmdModal.prix')}</span>
                  <span className="rt-detail-value rt-detail-value--mono">{prix}</span>
                </div>
                <div className="rt-detail-item">
                  <span className="rt-detail-label">{t('cmdModal.distanceEstimee')}</span>
                  <span className="rt-detail-value">{distance}</span>
                </div>
              </div>
            </section>

            <section className="rt-detail-section">
              <h3 className="rt-detail-section-title">{t('cmdModal.sectionPlanif')}</h3>
              <div className="rt-detail-grid">
                <div className="rt-detail-item">
                  <span className="rt-detail-label">{t('cmdModal.dateCollecte')}</span>
                  <span className="rt-detail-value">{dateCollecte}</span>
                </div>
                <div className="rt-detail-item">
                  <span className="rt-detail-label">{t('cmdModal.heureLivraison')}</span>
                  <span className="rt-detail-value">{heureLivraison}</span>
                </div>
                <div className="rt-detail-item rt-detail-item--wide">
                  <span className="rt-detail-label">{t('cmdModal.routeAssociee')}</span>
                  <span className="rt-detail-value rt-detail-value--mono">{routeId}</span>
                </div>
              </div>
            </section>

            <section className="rt-detail-section">
              <h3 className="rt-detail-section-title">{t('cmdModal.sectionParticipants')}</h3>
              <div className="rt-detail-grid">
                <div className="rt-detail-item">
                  <span className="rt-detail-label">{t('cmdModal.agriculteur')}</span>
                  <span className="rt-detail-value">{agriculteur}</span>
                </div>
                <div className="rt-detail-item">
                  <span className="rt-detail-label">{t('cmdModal.transporteur')}</span>
                  <span className="rt-detail-value">{transporteur}</span>
                </div>
              </div>
            </section>

            <section className="rt-detail-section">
              <h3 className="rt-detail-section-title">{t('cmdModal.sectionAdresses')}</h3>
              <div className="rt-detail-grid">
                <div className="rt-detail-item rt-detail-item--wide">
                  <span className="rt-detail-label">{t('cmdModal.collecte')}</span>
                  <span className="rt-detail-value">{adresseCollecte}</span>
                  <span className="rt-detail-muted">{pickupCoords}</span>
                </div>
                <div className="rt-detail-item rt-detail-item--wide">
                  <span className="rt-detail-label">{t('cmdModal.livraison')}</span>
                  <span className="rt-detail-value">{adresseLivraison}</span>
                  <span className="rt-detail-muted">{dropCoords}</span>
                </div>
              </div>
            </section>

            <section className="rt-detail-section">
              <h3 className="rt-detail-section-title">Actions rapides</h3>
              <div className="rt-detail-actions">
                {onEdit && (
                  <button type="button" className="rt-detail-action" onClick={() => { onEdit(commandeId, commande); onClose(); }}>
                    <Pencil size={14} />
                    <span>{t('routePage.btnEdit', { defaultValue: 'Modifier' })}</span>
                  </button>
                )}
                {onDelete && (
                  <button type="button" className="rt-detail-action" onClick={() => { onDelete(commandeId, commande); onClose(); }}>
                    <Trash2 size={14} />
                    <span>{t('routePage.btnDelete', { defaultValue: 'Supprimer' })}</span>
                  </button>
                )}
              </div>
            </section>
        </div>
      </aside>
    </div>
  );
}
