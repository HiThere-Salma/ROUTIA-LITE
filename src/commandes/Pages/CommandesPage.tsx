import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getAllCommandes } from "../Services/commande.service";
import { deleteCommande } from "../Repo/commande.repo";
import CommandesTable from "../Components/CommandesTable";
import CommandeDetailsModal from "../Components/CommandeDetailsModal";
import CommandeEditModal from "../Components/CommandeEditModal";
import type { CommandeData } from "../commandes.types";

const ITEMS_PER_PAGE = 10;
const FILTER_ALL = "__all__";

function asText(value: unknown, fallback = "-") {
  if (value === null || value === undefined || value === "") return fallback;

  return String(value);
}

function asCommandeId(commande: CommandeData, index: number) {
  return asText(
    commande.id ?? commande.id_commande ?? commande.commande_id ?? commande.reference ?? commande.num_commande ?? commande.numero ?? commande.numero_commande,
    `CMD-${index + 1}`
  );
}

function formatStatusLabel(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "En attente";

  return raw
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/^./, (letter) => letter.toUpperCase());
}

function readSelectedCommandeIdFromUrl() {
  const url = new URL(window.location.href);

  return url.searchParams.get("commandeId");
}

function updateCommandeIdInUrl(commandeId: string | null) {
  const url = new URL(window.location.href);

  if (commandeId) url.searchParams.set("commandeId", commandeId);
  else url.searchParams.delete("commandeId");

  window.history.pushState({}, "", url.toString());
}

export default function CommandesPage() {
  const [commandes, setCommandes] = useState<CommandeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(FILTER_ALL);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCommandeId, setSelectedCommandeId] = useState<string | null>(readSelectedCommandeIdFromUrl());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCommande, setEditCommande] = useState<CommandeData | null>(null);
  const [editCommandeId, setEditCommandeId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalMode, setEditModalMode] = useState<"create" | "edit">("edit");

  const loadCommandes = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const data = await getAllCommandes();
      const list = Array.isArray(data) ? (data as CommandeData[]) : [];
      setCommandes(list);
    } catch (error) {
      console.error(error);
      setErrorMessage("Impossible de charger les commandes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const onPopState = () => setSelectedCommandeId(readSelectedCommandeIdFromUrl());

    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    loadCommandes();
  }, [loadCommandes]);

  const getStatus = (commande: CommandeData) =>
    formatStatusLabel(commande.statut ?? commande.status ?? commande.etat ?? commande.etat_commande ?? commande.etat_livraison);

  const getPrimaryFields = (commande: CommandeData) => ({
    date_collecte: asText(commande.date_collecte ?? commande.date ?? commande.created_at),
    heure_livraison: asText(commande.heure_livraison ?? commande.heure ?? commande.heure_collecte ?? commande.time),
    adresse_collecte: asText(commande.adresse_collecte ?? commande.collecte ?? commande.origine),
    adresse_livraison: asText(commande.adresse_livraison ?? commande.livraison ?? commande.destination),
  });

  const getCollecteLivraison = (commande: CommandeData) => ({
    collecte: asText(commande.collecte ?? commande.adresse_collecte ?? commande.origine),
    livraison: asText(commande.livraison ?? commande.adresse_livraison ?? commande.destination),
  });

  const getNature = (commande: CommandeData) =>
    asText(commande.nature ?? commande.produit ?? commande.type_produit, "-");

  const statusFilterOptions = useMemo(() => {
    const uniqueStatuses = new Set<string>();

    commandes.forEach((commande) => {
      uniqueStatuses.add(getStatus(commande));
    });

    const dynamicValues = Array.from(uniqueStatuses)
      .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }))
      .map((value) => ({ value, label: value }));

    return [{ value: FILTER_ALL, label: "Tous les statuts" }, ...dynamicValues];
  }, [commandes, getStatus]);

  useEffect(() => {
    if (!statusFilterOptions.some((option) => option.value === selectedStatusFilter)) {
      setSelectedStatusFilter(FILTER_ALL);
    }
  }, [selectedStatusFilter, statusFilterOptions]);

  const filteredCommandes = useMemo(() => {
    const searchLower = search.toLowerCase().trim();

    return commandes.filter((commande, index) => {
      const commandeId = asCommandeId(commande, index).toLowerCase();
      const produit = getNature(commande).toLowerCase();
      const collecte = getCollecteLivraison(commande).collecte.toLowerCase();
      const livraison = getCollecteLivraison(commande).livraison.toLowerCase();

      const matchSearch =
        searchLower.length === 0 ||
        commandeId.includes(searchLower) ||
        produit.includes(searchLower) ||
        collecte.includes(searchLower) ||
        livraison.includes(searchLower);

      const statusValue = getStatus(commande).toLowerCase();
      const matchFilter = selectedStatusFilter === FILTER_ALL || statusValue === selectedStatusFilter.toLowerCase();

      return matchSearch && matchFilter;
    });
  }, [commandes, getStatus, search, selectedStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCommandes.length / ITEMS_PER_PAGE));

  useEffect(() => {
    setCurrentPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const paginatedCommandes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCommandes.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredCommandes]);

  const selectedCommande = useMemo(() => {
    if (!selectedCommandeId) return null;

    return (
      commandes.find((commande, index) => asCommandeId(commande, index) === selectedCommandeId) ?? null
    );
  }, [commandes, selectedCommandeId]);

  const onSelectCommande = (commandeId: string) => {
    setSelectedCommandeId(commandeId);
    updateCommandeIdInUrl(commandeId);
    setIsModalOpen(true);
  };

  const onCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCommandeId(null);
    updateCommandeIdInUrl(null);
  };

  const onEditCommande = (commandeId: string, commande: CommandeData) => {
    setEditModalMode("edit");
    setEditCommandeId(commandeId);
    setEditCommande(commande);
    setIsEditModalOpen(true);
  };

  const onCreateCommande = () => {
    setEditModalMode("create");
    setEditCommandeId(null);
    setEditCommande(null);
    setIsEditModalOpen(true);
  };

  const onCloseEditModal = () => {
    setIsEditModalOpen(false);
    setEditCommandeId(null);
    setEditCommande(null);
  };

  const onSaved = async () => {
    await loadCommandes();
    onCloseEditModal();
  };

  const onDeleteCommande = (commandeId: string, commande: CommandeData) => {
    if (!window.confirm(`Supprimer la commande #${commandeId} ? Cette action est irreversible.`)) return;
    const rawId = String(commande.id ?? commande.id_commande ?? commande.commande_id ?? "");
    if (!rawId) return;
    deleteCommande(rawId)
      .then(() => {
        setCommandes((prev) =>
          prev.filter((c, i) => asCommandeId(c, i) !== commandeId)
        );
      })
      .catch((err: unknown) => {
        alert(err instanceof Error ? err.message : "Erreur lors de la suppression.");
      });
  };

  return (
    <div className="cmd-page">
      <div className="cmd-header-row">
        <div className="dashboard-hero cmd-title-wrap">
          <h1 className="dashboard-title">Gestion des commandes</h1>
          <p className="dashboard-sub">Suivi en temps reel de l'activite logistique RoutIA.</p>
        </div>

        <button className="btn-add-agri" type="button" onClick={onCreateCommande}>+ Nouvelle commande</button>
      </div>

      <div className="cmd-search-row">
        <div className="cmd-search-wrap cmd-search-wrap--compact">
          <Search size={14} color="var(--text-muted)" />
          <input
            className="cmd-search-input"
            placeholder="Rechercher une commande, un lieu..."
            type="text"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <div className="cmd-filter-row">
        <div className="cmd-filter-grid">
          <label className="cmd-filter-field">
            <span>Statut</span>
            <select
              className="cmd-filter-select"
              value={selectedStatusFilter}
              onChange={(event) => {
                setSelectedStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
            >
              {statusFilterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="cmd-filter-actions">
          <button
            className="agri-btn-outline"
            type="button"
            onClick={() => {
              setSelectedStatusFilter(FILTER_ALL);
              setSearch("");
              setCurrentPage(1);
            }}
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {loading ? (
        <div className="cmd-feedback">Chargement des commandes...</div>
      ) : errorMessage ? (
        <div className="cmd-feedback cmd-feedback--error">{errorMessage}</div>
      ) : (
        <>
          <CommandesTable
            commandes={paginatedCommandes}
            selectedCommandeId={selectedCommandeId}
            onSelectCommande={onSelectCommande}
            getCommandeId={asCommandeId}
            getPrimaryFields={getPrimaryFields}
            getStatus={getStatus}
            onEditCommande={onEditCommande}
            onDeleteCommande={onDeleteCommande}
          />

          <div className="agri-pagination">
            <span className="agri-pag-info">
              Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + (filteredCommandes.length > 0 ? 1 : 0)}-
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredCommandes.length)} sur {filteredCommandes.length}
            </span>
            <div className="agri-pag-pages">
              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                type="button"
              >
                ‹
              </button>

              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={`page-btn ${currentPage === pageNumber ? "page-btn--active" : ""}`}
                  onClick={() => setCurrentPage(pageNumber)}
                  type="button"
                >
                  {pageNumber}
                </button>
              ))}

              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                type="button"
              >
                ›
              </button>
            </div>
          </div>

          <CommandeDetailsModal
            commande={isModalOpen ? selectedCommande : null}
            commandeId={isModalOpen ? selectedCommandeId : null}
            onClose={onCloseModal}
          />

          <CommandeEditModal
            mode={editModalMode}
            isOpen={isEditModalOpen}
            commande={editModalMode === "edit" ? editCommande : null}
            commandeId={editModalMode === "edit" ? editCommandeId : null}
            onClose={onCloseEditModal}
            onSaved={onSaved}
          />
        </>
      )}
    </div>
  );
}
