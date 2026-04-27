import type { CommandeData } from "../commandes.types";

type CommandeDetailsPanelProps = {
  commande: CommandeData | null;
  commandeId: string | null;
};

function formatDetailValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  if (typeof value === "object") return JSON.stringify(value);

  return String(value);
}

export default function CommandeDetailsPanel({ commande, commandeId }: CommandeDetailsPanelProps) {
  if (!commandeId) {
    return (
      <div className="cmd-details-empty">
        Clique sur une commande pour afficher ses details via l'URL.
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="cmd-details-empty">
        Aucune commande trouvee pour l'identifiant: {commandeId}
      </div>
    );
  }

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
    ...Object.entries(commande).filter(([key]) => !requiredKeys.has(key)),
  ];

  return (
    <section className="cmd-details-panel">
      <div className="cmd-details-header">
        <h2>Details de la commande</h2>
        <span className="cmd-details-id">#{commandeId}</span>
      </div>

      <div className="cmd-details-grid">
        {entries.map(([key, value]) => (
          <div className="cmd-details-item" key={key}>
            <span className="cmd-details-key">{key}</span>
            <span className="cmd-details-value">{formatDetailValue(value)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
