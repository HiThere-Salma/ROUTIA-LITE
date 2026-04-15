import { useEffect } from "react";
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

const LABEL_MAP: Record<string, string> = {
  id: "ID",
  id_commande: "ID Commande",
  commande_id: "ID Commande",
  reference: "Référence",
  statut: "Statut",
  status: "Statut",
  etat: "État",
  date: "Date",
  date_collecte: "Date de collecte",
  created_at: "Date de création",
  heure: "Heure",
  heure_collecte: "Heure de collecte",
  heure_livraison: "Heure de livraison",
  time: "Heure",
  collecte: "Adresse de collecte",
  adresse_collecte: "Adresse de collecte",
  origine: "Origine",
  livraison: "Adresse de livraison",
  adresse_livraison: "Adresse de livraison",
  destination: "Destination",
  distance_estimee: "Distance estimée",
  trajet: "Trajet",
  distance: "Distance",
  distance_km: "Distance (km)",
  kilometrage: "Kilométrage",
  temps_estime: "Temps estimé",
  duree: "Durée",
  etat_trajet: "État du trajet",
  nature: "Nature",
  produit: "Produit",
  type_produit: "Type de produit",
  transporteur: "Transporteur",
  nom_transporteur: "Nom transporteur",
  agriculteur: "Agriculteur",
  nom_agriculteur: "Nom agriculteur",
  poids: "Poids",
  volume: "Volume",
  quantite: "Quantité",
  prix: "Prix",
  montant: "Montant",
  notes: "Notes",
  commentaire: "Commentaire",
};

function getLabel(key: string): string {
  return LABEL_MAP[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const STATUS_KEYS = ["statut", "status", "etat"];

export default function CommandeDetailsModal({ commande, commandeId, onClose }: CommandeDetailsModalProps) {
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

  const requiredEntries: Array<[string, unknown]> = [
    ["date_collecte", commande.date_collecte ?? commande.date ?? commande.created_at],
    ["heure_livraison", commande.heure_livraison ?? commande.heure ?? commande.heure_collecte ?? commande.time],
    ["adresse_collecte", commande.adresse_collecte ?? commande.collecte ?? commande.origine],
    ["adresse_livraison", commande.adresse_livraison ?? commande.livraison ?? commande.destination],
    [
      "distance_estimee",
      commande.distance_estimee ??
        commande.distance ??
        commande.distance_km ??
        commande.kilometrage ??
        commande.temps_estime ??
        commande.duree,
    ],
  ];

  const requiredKeys = new Set(requiredEntries.map(([key]) => key));

  const entries = [
    ...requiredEntries,
    ...Object.entries(commande).filter(
      ([key]) => (!STATUS_KEYS.includes(key) || key === statusKey) && !requiredKeys.has(key)
    ),
  ];

  return (
    <div className="cmd-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-modal-header">
          <div className="cmd-modal-title-wrap">
            <h2 className="cmd-modal-title">Détails de la commande</h2>
            <span className="cmd-details-id">#{commandeId}</span>
          </div>
          <div className="cmd-modal-header-right">
            <CommandeStatusBadge status={statusValue} />
            <button className="cmd-modal-close" onClick={onClose} type="button" aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="cmd-modal-body">
          <div className="cmd-modal-grid">
            {entries.map(([key, value]) => (
              <div className="cmd-modal-field" key={key}>
                <span className="cmd-modal-field-label">{getLabel(key)}</span>
                <span className="cmd-modal-field-value">{formatValue(value)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
