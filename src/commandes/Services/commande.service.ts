import { fetchAllCommandes } from "../Repo/commande.repo";

export const getAllCommandes = async () => {
    try {
        const commandes = await fetchAllCommandes();

        return commandes;
    } catch (error) {
        console.error("Error fetching commandes:", error);
        throw new Error("Failed to fetch commandes.");
    }
};