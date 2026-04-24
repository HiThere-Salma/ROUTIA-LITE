import {
    createCommande,
    fetchAgriculteurs,
    fetchAllCommandes,
    fetchRoutesForAssociation,
    updateCommande,
} from "../Repo/commande.repo";
import type {
    AgriculteurOption,
    CommandeMutationPayload,
    RouteOption,
} from "../commandes.types";
import { geocodeCommandeAddresses } from "../../lib/geocoding";

export const getAllCommandes = async () => {
    try {
        const commandes = await fetchAllCommandes();

        return commandes;
    } catch (error) {
        console.error("Error fetching commandes:", error);
        throw new Error("Failed to fetch commandes.");
    }
};

export const getAgriculteurs = async (): Promise<AgriculteurOption[]> => {
    try {
        return await fetchAgriculteurs();
    } catch (error) {
        console.error("Error fetching agriculteurs:", error);
        throw new Error("Failed to fetch agriculteurs.");
    }
};

export const getRoutesForAssociation = async (): Promise<RouteOption[]> => {
    try {
        return await fetchRoutesForAssociation();
    } catch (error) {
        console.error("Error fetching routes:", error);
        throw new Error("Failed to fetch routes.");
    }
};

/**
 * Met à jour une commande puis géocode ses adresses en arrière-plan.
 * Les coordonnées sont écrites dans les colonnes pickup_lat/pickup_lng
 * et drop_lat/drop_lng si elles existent dans la table.
 */
export const saveCommandeUpdate = async (id: string, payload: CommandeMutationPayload) => {
    try {
        const updated = await updateCommande(id, payload);

        // Géocodage en arrière-plan (non bloquant pour l'UX)
        if (payload.adresse_collecte || payload.adresse_livraison) {
            geocodeCommandeAddresses(
                payload.adresse_collecte ?? "",
                payload.adresse_livraison ?? ""
            )
                .then(({ collecte, livraison }) => {
                    const coords: Record<string, number> = {};
                    if (collecte) {
                        coords.pickup_lat = collecte.lat;
                        coords.pickup_lng = collecte.lng;
                    }
                    if (livraison) {
                        coords.drop_lat = livraison.lat;
                        coords.drop_lng = livraison.lng;
                    }
                    if (Object.keys(coords).length > 0) {
                        updateCommande(id, coords).catch(console.warn);
                    }
                })
                .catch(console.warn);
        }

        return updated;
    } catch (error) {
        console.error("Error updating commande:", error);
        throw new Error("Failed to update commande.");
    }
};

/**
 * Crée une commande puis géocode ses adresses en arrière-plan.
 */
export const createNewCommande = async (payload: CommandeMutationPayload) => {
    try {
        let payloadWithCoords: CommandeMutationPayload = { ...payload };

        if (payload.adresse_collecte || payload.adresse_livraison) {
            try {
                const { collecte, livraison } = await geocodeCommandeAddresses(
                    payload.adresse_collecte ?? "",
                    payload.adresse_livraison ?? ""
                );

                payloadWithCoords = {
                    ...payload,
                    pickup_lat: collecte?.lat ?? null,
                    pickup_lng: collecte?.lng ?? null,
                    drop_lat: livraison?.lat ?? null,
                    drop_lng: livraison?.lng ?? null,
                };
            } catch (geocodeError) {
                // Keep creation flow resilient even if geocoding fails.
                console.warn("Geocoding failed while creating commande:", geocodeError);
            }
        }

        const created = await createCommande(payloadWithCoords);

        // Géocodage en arrière-plan
        if (
            created &&
            (payload.adresse_collecte || payload.adresse_livraison) &&
            (payloadWithCoords.pickup_lat == null || payloadWithCoords.drop_lat == null)
        ) {
            const createdId = String((created as Record<string, unknown>).id ?? "");
            if (createdId) {
                geocodeCommandeAddresses(
                    payload.adresse_collecte ?? "",
                    payload.adresse_livraison ?? ""
                )
                    .then(({ collecte, livraison }) => {
                        const coords: Record<string, number> = {};
                        if (collecte) {
                            coords.pickup_lat = collecte.lat;
                            coords.pickup_lng = collecte.lng;
                        }
                        if (livraison) {
                            coords.drop_lat = livraison.lat;
                            coords.drop_lng = livraison.lng;
                        }
                        if (Object.keys(coords).length > 0) {
                            updateCommande(createdId, coords).catch(console.warn);
                        }
                    })
                    .catch(console.warn);
            }
        }

        return created;
    } catch (error) {
        console.error("Error creating commande:", error);
        throw new Error("Failed to create commande.");
    }
};