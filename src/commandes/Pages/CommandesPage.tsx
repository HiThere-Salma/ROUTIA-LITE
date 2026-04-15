import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { getAllCommandes } from "../Services/commande.service";
import CommandesTable from "../Components/CommandesTable";
import CommandeDetailsModal from "../Components/CommandeDetailsModal";
import type { CommandeData, CommandeFilter } from "../commandes.types";

const ITEMS_PER_PAGE = 10;

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
  const [filter, setFilter] = useState<CommandeFilter>("toutes");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCommandeId, setSelectedCommandeId] = useState<string | null>(readSelectedCommandeIdFromUrl());
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const onPopState = () => setSelectedCommandeId(readSelectedCommandeIdFromUrl());

    window.addEventListener("popstate", onPopState);

    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    let mounted = true;

    const fetchCommandes = async () => {
      setLoading(true);
      setErrorMessage(null);

      try {
        
        const data = await getAllCommandes();
        if (mounted) {
          const list = Array.isArray(data) ? (data as CommandeData[]) : [];
          setCommandes(list);
        }
      } catch (error) {
        console.error(error);
        if (mounted) setErrorMessage("Impossible de charger les commandes.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCommandes();

    return () => {
      mounted = false;
    };
  }, []);

  const getStatus = (commande: CommandeData) =>
    asText(
      commande.statut ?? commande.status ?? commande.etat ?? commande.etat_commande ?? commande.etat_livraison,
      "En attente"
    );

  const getPrimaryFields = (commande: CommandeData) => ({
    date_collecte: asText(commande.date_collecte ?? commande.date ?? commande.created_at),
    heure_livraison: asText(commande.heure_livraison ?? commande.heure ?? commande.heure_collecte ?? commande.time),
    adresse_collecte: asText(commande.adresse_collecte ?? commande.collecte ?? commande.origine),
    adresse_livraison: asText(commande.adresse_livraison ?? commande.livraison ?? commande.destination),
    distance_estimee: asText(
      commande.distance_estimee ??
        commande.distance ??
        commande.distance_km ??
        commande.kilometrage ??
        commande.temps_estime ??
        commande.duree
    ),
  });

  const getCollecteLivraison = (commande: CommandeData) => ({
    collecte: asText(commande.collecte ?? commande.adresse_collecte ?? commande.origine),
    livraison: asText(commande.livraison ?? commande.adresse_livraison ?? commande.destination),
  });

  const getNature = (commande: CommandeData) =>
    asText(commande.nature ?? commande.produit ?? commande.type_produit, "-");

  const filteredCommandes = useMemo(() => {
    const searchLower = search.toLowerCase().trim();

    return commandes.filter((commande, index) => {
      const status = getStatus(commande).toLowerCase();
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

      const matchFilter =
        filter === "toutes" ||
        (filter === "livrees" && status.includes("livr")) ||
        (filter === "en_cours" && (status.includes("cours") || status.includes("transport"))) ||
        (filter === "attente" && status.includes("attente"));

      return matchSearch && matchFilter;
    });
  }, [commandes, filter, search]);

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

  return (
    <div className="cmd-page">
      <div className="cmd-toolbar-row">
        <div className="cmd-search-wrap">
          <Search size={16} color="var(--text-muted)" />
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

        <button className="btn-add-agri" type="button">+ Nouvelle commande</button>
      </div>

      <div className="dashboard-hero">
        <h1 className="dashboard-title">Gestion des commandes</h1>
        <p className="dashboard-sub">Suivi en temps reel de l'activite logistique RoutIA.</p>
      </div>

      <div className="cmd-filter-row">
        <div className="cmd-tabs">
          <button
            className={`cmd-tab ${filter === "toutes" ? "cmd-tab--active" : ""}`}
            onClick={() => {
              setFilter("toutes");
              setCurrentPage(1);
            }}
            type="button"
          >
            Toutes
          </button>
          <button
            className={`cmd-tab ${filter === "en_cours" ? "cmd-tab--active" : ""}`}
            onClick={() => {
              setFilter("en_cours");
              setCurrentPage(1);
            }}
            type="button"
          >
            En cours
          </button>
          <button
            className={`cmd-tab ${filter === "livrees" ? "cmd-tab--active" : ""}`}
            onClick={() => {
              setFilter("livrees");
              setCurrentPage(1);
            }}
            type="button"
          >
            Livrees
          </button>
          <button
            className={`cmd-tab ${filter === "attente" ? "cmd-tab--active" : ""}`}
            onClick={() => {
              setFilter("attente");
              setCurrentPage(1);
            }}
            type="button"
          >
            Attente
          </button>
        </div>

        <div className="cmd-filter-actions">
          <button
            className="agri-btn-outline"
            type="button"
            onClick={() => {
              setFilter("toutes");
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
            getNature={getNature}
            getStatus={getStatus}
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
        </>
      )}
    </div>
  );
}
