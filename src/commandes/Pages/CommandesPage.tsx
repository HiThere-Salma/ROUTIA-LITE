import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from 'react-i18next';
import { Search } from "lucide-react";
import { getAllCommandes } from "../Services/commande.service";
import { deleteCommande } from "../Repo/commande.repo";
import CommandesTable from "../Components/CommandesTable";
import CommandeDetailsModal from "../Components/CommandeDetailsModal";
import CommandeEditModal from "../Components/CommandeEditModal";
import CommandeDeleteModal from "../Components/CommandeDeleteModal";
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
  const { t } = useTranslation()
  const [commandes, setCommandes] = useState<CommandeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState(FILTER_ALL);
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCommandeId, setSelectedCommandeId] = useState<string | null>(readSelectedCommandeIdFromUrl());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCommande, setEditCommande] = useState<CommandeData | null>(null);
  const [editCommandeId, setEditCommandeId] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalMode, setEditModalMode] = useState<"create" | "edit">("edit");
  const [deleteTarget, setDeleteTarget] = useState<{ commandeId: string; commande: CommandeData } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCommandes = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const data = await getAllCommandes();
        if (active) setCommandes(Array.isArray(data) ? (data as CommandeData[]) : []);
      } catch (error) {
        console.error(error);
        if (active) setErrorMessage("Impossible de charger les commandes.");
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [refreshKey]);

  useEffect(() => {
    const onPopState = () => setSelectedCommandeId(readSelectedCommandeIdFromUrl());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const getStatus = useCallback((commande: CommandeData) =>
    formatStatusLabel(commande.statut ?? commande.status ?? commande.etat ?? commande.etat_commande ?? commande.etat_livraison), []);

  const getPrimaryFields = (commande: CommandeData) => ({
    date_collecte: asText(commande.date_collecte ?? commande.date ?? commande.created_at),
    heure_livraison: asText(commande.heure_livraison ?? commande.heure ?? commande.heure_collecte ?? commande.time),
    adresse_collecte: asText(commande.adresse_collecte ?? commande.collecte ?? commande.origine),
    adresse_livraison: asText(commande.adresse_livraison ?? commande.livraison ?? commande.destination),
  });

  const statusFilterOptions = useMemo(() => {
    const uniqueStatuses = new Set<string>();

    commandes.forEach((commande) => {
      uniqueStatuses.add(getStatus(commande));
    });

    const dynamicValues = Array.from(uniqueStatuses)
      .sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" }))
      .map((value) => ({ value, label: value }));

    return [{ value: FILTER_ALL, label: t('cmdPage.filterAll') }, ...dynamicValues];
  }, [commandes, getStatus, t]);

  const effectiveStatusFilter = statusFilterOptions.some((o) => o.value === selectedStatusFilter)
    ? selectedStatusFilter
    : FILTER_ALL;

  const filteredCommandes = useMemo(() => {
    const searchLower = search.toLowerCase().trim();

    return commandes.filter((commande, index) => {
      // Recherche sur toutes les colonnes retournées par vue_commandes
      // (incluant nom/prénom agriculteur, transporteur, etc. injectés par la vue)
      const matchSearch =
        searchLower.length === 0 ||
        Object.values(commande).some((val) => {
          if (val === null || val === undefined) return false;
          if (typeof val === "object") return false;
          return String(val).toLowerCase().includes(searchLower);
        }) ||
        asCommandeId(commande, index).toLowerCase().includes(searchLower);

      const statusValue = getStatus(commande).toLowerCase();
      const matchFilter = effectiveStatusFilter === FILTER_ALL || statusValue === effectiveStatusFilter.toLowerCase();

      return matchSearch && matchFilter;
    });
  }, [commandes, getStatus, search, effectiveStatusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredCommandes.length / ITEMS_PER_PAGE));
  const effectivePage = Math.min(currentPage, totalPages);

  const paginatedCommandes = useMemo(() => {
    const start = (effectivePage - 1) * ITEMS_PER_PAGE;
    return filteredCommandes.slice(start, start + ITEMS_PER_PAGE);
  }, [effectivePage, filteredCommandes]);

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
    setDeleteTarget({ commandeId, commande });
  };

  const onConfirmDelete = () => {
    if (!deleteTarget) return;
    const { commandeId, commande } = deleteTarget;
    const rawId = String(commande.id ?? commande.id_commande ?? commande.commande_id ?? "");
    if (!rawId) return;
    setDeleting(true);
    deleteCommande(rawId)
      .then(() => {
        setCommandes((prev) =>
          prev.filter((c, i) => asCommandeId(c, i) !== commandeId)
        );
        setDeleteTarget(null);
      })
      .catch((err: unknown) => {
        console.error(err);
      })
      .finally(() => setDeleting(false));
  };

  return (
    <div className="cmd-page">
      <div className="cmd-header-row">
        <div className="dashboard-hero cmd-title-wrap">
          <h1 className="dashboard-title">{t('commandes.title')}</h1>
          <p className="dashboard-sub">{t('commandes.sub')}</p>
        </div>

        <button className="btn-add-agri" type="button" onClick={onCreateCommande}>{t('cmdPage.addBtn')}</button>
      </div>

      <div className="cmd-search-row">
        <div className="cmd-search-wrap cmd-search-wrap--compact">
          <Search size={14} color="var(--text-muted)" />
          <input
            className="cmd-search-input"
            placeholder={t('cmdPage.searchPlaceholder')}
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
            <span>{t('cmdPage.filterStatut')}</span>
            <select
              className="cmd-filter-select"
              value={effectiveStatusFilter}
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
            {t('cmdPage.resetBtn')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="cmd-feedback">{t('cmdPage.loading')}</div>
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
              {t('cmdPage.showing')} {(effectivePage - 1) * ITEMS_PER_PAGE + (filteredCommandes.length > 0 ? 1 : 0)}-
              {Math.min(effectivePage * ITEMS_PER_PAGE, filteredCommandes.length)} {t('cmdPage.of')} {filteredCommandes.length}
            </span>
            <div className="agri-pag-pages">
              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={effectivePage === 1}
                type="button"
              >
                ‹
              </button>

              {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map((pageNumber) => (
                <button
                  key={pageNumber}
                  className={`page-btn ${effectivePage === pageNumber ? "page-btn--active" : ""}`}
                  onClick={() => setCurrentPage(pageNumber)}
                  type="button"
                >
                  {pageNumber}
                </button>
              ))}

              <button
                className="page-btn"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={effectivePage === totalPages}
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

          <CommandeDeleteModal
            isOpen={!!deleteTarget}
            commandeId={deleteTarget?.commandeId ?? null}
            onConfirm={onConfirmDelete}
            onCancel={() => setDeleteTarget(null)}
            deleting={deleting}
          />
        </>
      )}
    </div>
  );
}
