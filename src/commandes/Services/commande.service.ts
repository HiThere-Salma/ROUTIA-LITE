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

export const saveCommandeUpdate = async (id: string, payload: CommandeMutationPayload) => {
    try {
        return await updateCommande(id, payload);
    } catch (error) {
        console.error("Error updating commande:", error);
        throw new Error("Failed to update commande.");
    }
};

export const createNewCommande = async (payload: CommandeMutationPayload) => {
    try {
        return await createCommande(payload);
    } catch (error) {
        console.error("Error creating commande:", error);
        throw new Error("Failed to create commande.");
    }
};