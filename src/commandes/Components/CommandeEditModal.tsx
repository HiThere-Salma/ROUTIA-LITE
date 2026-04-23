import { useEffect, useMemo, useState } from "react";
import { X, Save } from "lucide-react";
import CommandeStatusBadge from "./CommandeStatusBadge";
import AddressAutocompleteInput from "./AddressAutocompleteInput";
import {
  createNewCommande,
  getAgriculteurs,
  getRoutesForAssociation,
  saveCommandeUpdate,
} from "../Services/commande.service";
import type {
  AgriculteurOption,
  CommandeData,
  CommandeFormValues,
  CommandeMutationPayload,
  CommandeStatus,
  RouteOption,
} from "../commandes.types";

const STATUT_OPTIONS: Array<{ value: CommandeStatus; label: string }> = [
  { value: "en_attente", label: "En attente" },
  { value: "assignee", label: "Assignee" },
  { value: "recuperee", label: "Recuperee" },
  { value: "en_transport", label: "En transport" },
  { value: "livree", label: "Livree" },
  { value: "annulee", label: "Annulee" },
];

const EMPTY_FORM: CommandeFormValues = {
  agriculteur_id: "",
  route_id: null,
  date_collecte: "",
  heure_livraison: "",
  distance_estimee: "",
  adresse_collecte: "",
  adresse_livraison: "",
  produit: "",
  prix: "",
  statut: "en_attente",
};

function asString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function normalizeStatus(value: unknown): CommandeStatus {
  const status = asString(value).toLowerCase();
  const validStatus = STATUT_OPTIONS.find((option) => option.value === status)?.value;
  return validStatus ?? "en_attente";
}

function toFormValues(commande: CommandeData | null): CommandeFormValues {
  if (!commande) return { ...EMPTY_FORM };

  return {
    agriculteur_id: asString(commande.agriculteur_id),
    route_id: asString(commande.route_id) || null,
    date_collecte: asString(commande.date_collecte ?? commande.date),
    heure_livraison: asString(commande.heure_livraison ?? commande.heure),
    distance_estimee: asString(commande.distance_estimee ?? commande.distance_estimer ?? commande.distance),
    adresse_collecte: asString(commande.adresse_collecte ?? commande.collecte ?? commande.origine),
    adresse_livraison: asString(commande.adresse_livraison ?? commande.livraison ?? commande.destination),
    produit: asString(commande.produit ?? commande.nature),
    prix: asString(commande.prix ?? commande.montant),
    statut: normalizeStatus(commande.statut ?? commande.status ?? commande.etat),
  };
}

function toNullableNumber(value: string): number | null {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toMutationPayload(form: CommandeFormValues): CommandeMutationPayload {
  return {
    agriculteur_id: form.agriculteur_id,
    route_id: form.route_id,
    date_collecte: form.date_collecte,
    heure_livraison: form.heure_livraison || null,
    distance_estimee: toNullableNumber(form.distance_estimee),
    adresse_collecte: form.adresse_collecte,
    adresse_livraison: form.adresse_livraison,
    produit: form.produit,
    prix: toNullableNumber(form.prix),
    statut: form.statut,
  };
}

function routeLabel(route: RouteOption): string {
  const transporteur = route.utilisateurs
    ? `${route.utilisateurs.nom} ${route.utilisateurs.prenom}`
    : "Transporteur inconnu";
  return `${route.date || "Date inconnue"} - ${transporteur}`;
}

function routeMeta(route: RouteOption): string {
  return `ID transporteur ${route.transporteur_id} - Route ${route.id}`;
}

type CommandeEditModalProps = {
  mode: "create" | "edit";
  isOpen: boolean;
  commande: CommandeData | null;
  commandeId: string | null;
  onClose: () => void;
  onSaved: (saved: CommandeData, mode: "create" | "edit") => void;
};

export default function CommandeEditModal({
  mode,
  isOpen,
  commande,
  commandeId,
  onClose,
  onSaved,
}: CommandeEditModalProps) {
  const [form, setForm] = useState<CommandeFormValues>({ ...EMPTY_FORM });
  const [agriculteurs, setAgriculteurs] = useState<AgriculteurOption[]>([]);
  const [routes, setRoutes] = useState<RouteOption[]>([]);
  const [routeSearch, setRouteSearch] = useState("");
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCollecteAddressSelected, setIsCollecteAddressSelected] = useState(false);
  const [isLivraisonAddressSelected, setIsLivraisonAddressSelected] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const nextForm = toFormValues(mode === "edit" ? commande : null);
    setForm(nextForm);
    setRouteSearch("");
    setIsCollecteAddressSelected(Boolean(nextForm.adresse_collecte));
    setIsLivraisonAddressSelected(Boolean(nextForm.adresse_livraison));
    setSaveError(null);
  }, [commande, isOpen, mode]);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;

    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [agriculteursData, routesData] = await Promise.all([
          getAgriculteurs(),
          getRoutesForAssociation(),
        ]);

        if (!mounted) return;
        setAgriculteurs(agriculteursData);
        setRoutes(routesData);
      } catch (error) {
        if (!mounted) return;
        setSaveError(error instanceof Error ? error.message : "Erreur de chargement des options.");
      } finally {
        if (mounted) setLoadingOptions(false);
      }
    };

    loadOptions();

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  const filteredRoutes = useMemo(() => {
    const query = routeSearch.trim().toLowerCase();
    if (!query) return routes;

    return routes.filter((route) => {
      const transporteurNom = `${route.utilisateurs?.nom ?? ""} ${route.utilisateurs?.prenom ?? ""}`
        .trim()
        .toLowerCase();
      const routeId = route.id.toLowerCase();

      return transporteurNom.includes(query) || routeId.includes(query);
    });
  }, [routeSearch, routes]);

  if (!isOpen) return null;

  const rawId = asString(commande?.id ?? commande?.id_commande ?? commande?.commande_id);
  const statusLabel = STATUT_OPTIONS.find((status) => status.value === form.statut)?.label ?? "En attente";

  const handleChange = <K extends keyof CommandeFormValues>(key: K, value: CommandeFormValues[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleRouteSelection = (routeId: string) => {
    handleChange("route_id", routeId || null);
  };

  const isEditMode = mode === "edit";
  const title = isEditMode ? "Modifier la commande" : "Nouvelle commande";
  const selectedRoute = routes.find((route) => route.id === form.route_id) ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agriculteur_id) {
      setSaveError("Veuillez selectionner un agriculteur.");
      return;
    }
    if (!form.date_collecte || !form.adresse_collecte || !form.adresse_livraison || !form.produit) {
      setSaveError("Veuillez remplir les champs obligatoires de la commande.");
      return;
    }
    if (!isCollecteAddressSelected || !isLivraisonAddressSelected) {
      setSaveError("Veuillez choisir les adresses dans les suggestions Mapbox avant de sauvegarder.");
      return;
    }

    const payload = toMutationPayload(form);

    if (isEditMode && !rawId) {
      setSaveError("ID de commande introuvable, impossible de sauvegarder.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      if (isEditMode) {
        const updated = await saveCommandeUpdate(rawId, payload);
        onSaved((updated ?? {}) as CommandeData, "edit");
      } else {
        const created = await createNewCommande(payload);
        onSaved((created ?? {}) as CommandeData, "create");
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cmd-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-modal-header">
          <div className="cmd-modal-title-wrap">
            <h2 className="cmd-modal-title">{title}</h2>
            {isEditMode && commandeId && <span className="cmd-details-id">#{commandeId}</span>}
          </div>
          <div className="cmd-modal-header-right">
            <CommandeStatusBadge status={statusLabel} />
            <button className="cmd-modal-close" onClick={onClose} type="button" aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
        </div>

        <form className="cmd-modal-body" onSubmit={handleSubmit}>
          <div className="cmd-edit-grid">
            <div className="cmd-modal-field">
              <label className="cmd-modal-field-label" htmlFor="cmd-agriculteur-id">Agriculteur</label>
              <select
                id="cmd-agriculteur-id"
                className="cmd-edit-input"
                value={form.agriculteur_id}
                onChange={(e) => handleChange("agriculteur_id", e.target.value)}
                required
                disabled={saving || loadingOptions}
              >
                <option value="">-- Choisir un agriculteur --</option>
                {agriculteurs.map((agriculteur) => (
                  <option key={agriculteur.id} value={agriculteur.id}>
                    {`${agriculteur.nom} ${agriculteur.prenom} (ID ${agriculteur.id})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="cmd-modal-field">
              <label className="cmd-modal-field-label" htmlFor="cmd-date-collecte">Date collecte</label>
              <input
                id="cmd-date-collecte"
                className="cmd-edit-input"
                type="date"
                value={form.date_collecte}
                onChange={(e) => handleChange("date_collecte", e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div className="cmd-modal-field">
              <label className="cmd-modal-field-label" htmlFor="cmd-heure-livraison">Heure livraison</label>
              <input
                id="cmd-heure-livraison"
                className="cmd-edit-input"
                type="time"
                value={form.heure_livraison}
                onChange={(e) => handleChange("heure_livraison", e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="cmd-modal-field">
              <label className="cmd-modal-field-label" htmlFor="cmd-distance-estimee">Distance estimee</label>
              <input
                id="cmd-distance-estimee"
                className="cmd-edit-input"
                type="number"
                min="0"
                step="0.01"
                value={form.distance_estimee}
                onChange={(e) => handleChange("distance_estimee", e.target.value)}
                disabled={saving}
              />
            </div>

            <AddressAutocompleteInput
              id="cmd-adresse-collecte"
              label="Adresse collecte"
              value={form.adresse_collecte}
              onChange={(value) => handleChange("adresse_collecte", value)}
              isSelected={isCollecteAddressSelected}
              selectionRequired
              onSelectionStateChange={setIsCollecteAddressSelected}
              required
              disabled={saving}
              placeholder="Saisir l'adresse de collecte"
            />

            <AddressAutocompleteInput
              id="cmd-adresse-livraison"
              label="Adresse livraison"
              value={form.adresse_livraison}
              onChange={(value) => handleChange("adresse_livraison", value)}
              isSelected={isLivraisonAddressSelected}
              selectionRequired
              onSelectionStateChange={setIsLivraisonAddressSelected}
              required
              disabled={saving}
              placeholder="Saisir l'adresse de livraison"
            />

            <div className="cmd-modal-field cmd-edit-span-2">
              <label className="cmd-modal-field-label" htmlFor="cmd-produit">Produit</label>
              <input
                id="cmd-produit"
                className="cmd-edit-input"
                type="text"
                value={form.produit}
                onChange={(e) => handleChange("produit", e.target.value)}
                required
                disabled={saving}
              />
            </div>

            <div className="cmd-modal-field">
              <label className="cmd-modal-field-label" htmlFor="cmd-prix">Prix</label>
              <input
                id="cmd-prix"
                className="cmd-edit-input"
                type="number"
                min="0"
                step="0.01"
                value={form.prix}
                onChange={(e) => handleChange("prix", e.target.value)}
                disabled={saving}
              />
            </div>

            <div className="cmd-modal-field">
              <label className="cmd-modal-field-label" htmlFor="cmd-statut">Statut</label>
              <select
                id="cmd-statut"
                className="cmd-edit-input"
                value={form.statut}
                onChange={(e) => handleChange("statut", e.target.value as CommandeStatus)}
                disabled={saving}
              >
                {STATUT_OPTIONS.map((statusOption) => (
                  <option key={statusOption.value} value={statusOption.value}>
                    {statusOption.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <section className="cmd-route-association">
            <h3 className="cmd-route-association-title">Association optionnelle a une route</h3>
            {loadingOptions ? (
              <p className="cmd-route-association-empty">Chargement des routes...</p>
            ) : routes.length === 0 ? (
              <p className="cmd-route-association-empty">Aucune route disponible.</p>
            ) : (
              <div className="cmd-route-association-list">
                <input
                  className="cmd-edit-input"
                  type="text"
                  value={routeSearch}
                  onChange={(e) => setRouteSearch(e.target.value)}
                  placeholder="Rechercher route (ID) ou transporteur"
                  disabled={saving}
                />

                <label className="cmd-route-association-item cmd-route-association-item--none">
                  <input
                    type="radio"
                    name="cmd-route-choice"
                    checked={!form.route_id}
                    onChange={() => handleRouteSelection("")}
                    disabled={saving}
                  />
                  <span className="cmd-route-association-copy">
                    <span className="cmd-route-association-primary">Aucune route</span>
                    <span className="cmd-route-association-secondary">La commande reste non associee.</span>
                  </span>
                </label>

                {filteredRoutes.map((route) => {
                  const checked = form.route_id === route.id;
                  return (
                    <label key={route.id} className="cmd-route-association-item">
                      <input
                        type="radio"
                        name="cmd-route-choice"
                        checked={checked}
                        onChange={() => handleRouteSelection(route.id)}
                        disabled={saving}
                      />
                      <span className="cmd-route-association-copy">
                        <span className="cmd-route-association-primary">{routeLabel(route)}</span>
                        <span className="cmd-route-association-secondary">{routeMeta(route)}</span>
                      </span>
                    </label>
                  );
                })}

                {filteredRoutes.length === 0 && (
                  <p className="cmd-route-association-empty">Aucune route ne correspond a la recherche.</p>
                )}

                {form.route_id && (
                  <p className="cmd-route-association-help">
                    Route selectionnee: {selectedRoute ? routeLabel(selectedRoute) : "Inconnue"}
                  </p>
                )}
              </div>
            )}
            <p className="cmd-route-association-help">Une seule route peut etre associee a la commande.</p>
          </section>

          {saveError && <p className="cmd-edit-error">{saveError}</p>}

          <div className="cmd-edit-footer">
            <button className="agri-btn-outline" type="button" onClick={onClose}>
              Annuler
            </button>
            <button className="btn-add-agri" type="submit" disabled={saving}>
              <Save size={14} />
              {saving ? "Sauvegarde..." : isEditMode ? "Mettre a jour" : "Creer la commande"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
