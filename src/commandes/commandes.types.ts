export type CommandeData = Record<string, unknown>;

export type CommandeStatus =
	| "en_attente"
	| "assignee"
	| "recuperee"
	| "en_transport"
	| "livree"
	| "annulee";

export type CommandeFormValues = {
	agriculteur_id: string;
	route_id: string | null;
	date_collecte: string;
	heure_livraison: string;
	distance_estimee: string;
	adresse_collecte: string;
	adresse_livraison: string;
	produit: string;
	prix: string;
	statut: CommandeStatus;
};

export type CommandeMutationPayload = {
	agriculteur_id: string;
	route_id: string | null;
	date_collecte: string;
	heure_livraison: string | null;
	distance_estimee: number | null;
	adresse_collecte: string;
	adresse_livraison: string;
	produit: string;
	prix: number | null;
	statut: CommandeStatus;
};

export type AgriculteurOption = {
	id: string;
	nom: string;
	prenom: string;
};

export type RouteOption = {
	id: string;
	date: string;
	transporteur_id: string;
	utilisateurs: {
		nom: string;
		prenom: string;
	} | null;
};
