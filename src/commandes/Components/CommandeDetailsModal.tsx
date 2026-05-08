import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import CommandeStatusBadge from "./CommandeStatusBadge";
import type { CommandeData } from "../commandes.types";

type CommandeDetailsModalProps = {
  commande: CommandeData | null;
  commandeId: string | null;
  onClose: () => void;
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

export default function CommandeDetailsModal({ commande, commandeId, onClose }: CommandeDetailsModalProps) {
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

  return (
    <div className="cmd-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cmd-modal cmd-modal--details" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-modal-header">
          <div className="cmd-modal-title-wrap">
            <h2 className="cmd-modal-title">{t('cmdModal.detailsTitle')}</h2>
            <span className="cmd-details-id">#{commandeId}</span>
          </div>
          <div className="cmd-modal-header-right">
            <CommandeStatusBadge status={statusValue} />
            <button className="cmd-modal-close" onClick={onClose} type="button" aria-label={t('common.close')}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="cmd-modal-body cmd-modal-body--details">
          <div className="cmd-modal-details-layout">
            <section className="cmd-modal-details-section">
              <h3 className="cmd-modal-details-section-title">{t('cmdModal.sectionGeneral')}</h3>
              <div className="cmd-modal-details-row">
                <div className="cmd-modal-details-item">
                  <span className="cmd-modal-details-key">{t('cmdModal.produit')}</span>
                  <span className="cmd-modal-details-value">{produit}</span>
                </div>
                <div className="cmd-modal-details-item">
                  <span className="cmd-modal-details-key">{t('cmdModal.prix')}</span>
                  <span className="cmd-modal-details-value cmd-modal-details-value--mono">{prix}</span>
                </div>
                <div className="cmd-modal-details-item">
                  <span className="cmd-modal-details-key">{t('cmdModal.distanceEstimee')}</span>
                  <span className="cmd-modal-details-value">{distance}</span>
                </div>
              </div>
            </section>

            <section className="cmd-modal-details-section">
              <h3 className="cmd-modal-details-section-title">{t('cmdModal.sectionPlanif')}</h3>
              <div className="cmd-modal-details-row">
                <div className="cmd-modal-details-item">
                  <span className="cmd-modal-details-key">{t('cmdModal.dateCollecte')}</span>
                  <span className="cmd-modal-details-value">{dateCollecte}</span>
                </div>
                <div className="cmd-modal-details-item">
                  <span className="cmd-modal-details-key">{t('cmdModal.heureLivraison')}</span>
                  <span className="cmd-modal-details-value">{heureLivraison}</span>
                </div>
                <div className="cmd-modal-details-item">
                  <span className="cmd-modal-details-key">{t('cmdModal.routeAssociee')}</span>
                  <span className="cmd-modal-details-value cmd-modal-details-value--mono">{routeId}</span>
                </div>
              </div>
            </section>

            <section className="cmd-modal-details-section">
              <h3 className="cmd-modal-details-section-title">{t('cmdModal.sectionParticipants')}</h3>
              <div className="cmd-modal-details-row">
                <div className="cmd-modal-details-item">
                  <span className="cmd-modal-details-key">{t('cmdModal.agriculteur')}</span>
                  <span className="cmd-modal-details-value">{agriculteur}</span>
                </div>
                <div className="cmd-modal-details-item">
                  <span className="cmd-modal-details-key">{t('cmdModal.transporteur')}</span>
                  <span className="cmd-modal-details-value">{transporteur}</span>
                </div>
              </div>
            </section>

            <section className="cmd-modal-details-section">
              <h3 className="cmd-modal-details-section-title">{t('cmdModal.sectionAdresses')}</h3>
              <div className="cmd-modal-details-row cmd-modal-details-row--stack">
                <div className="cmd-modal-details-item">
                  <span className="cmd-modal-details-key">{t('cmdModal.collecte')}</span>
                  <span className="cmd-modal-details-value cmd-modal-details-value--address">{adresseCollecte}</span>
                </div>
                <div className="cmd-modal-details-item">
                  <span className="cmd-modal-details-key">{t('cmdModal.livraison')}</span>
                  <span className="cmd-modal-details-value cmd-modal-details-value--address">{adresseLivraison}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
