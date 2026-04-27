import { getSupabaseClient } from "../../lib/supabase/supabase.client"
import type {
  AgriculteurOption,
  CommandeMutationPayload,
  RouteOption,
} from "../commandes.types";

export const fetchAllCommandes = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("vue_commandes")
    .select("*")
    .order("date_creation", { ascending: false });
  console.log("Fetched commandes:", data);

  if (error) {
    throw new Error(error.message || "Impossible de recuperer les commandes.");
  }

  return data;
};

export const deleteCommande = async (id: string) => {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("commandes").delete().eq("id", id);

  if (error) {
    throw new Error(error.message || "Impossible de supprimer la commande.");
  }
};

export const updateCommande = async (id: string, fields: Record<string, unknown>) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("commandes")
    .update(fields)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Impossible de mettre a jour la commande.");
  }

  return data;
};

export const createCommande = async (fields: CommandeMutationPayload) => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("commandes")
    .insert(fields)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message || "Impossible de creer la commande.");
  }

  return data;
};

export const fetchAgriculteurs = async (): Promise<AgriculteurOption[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("utilisateurs")
    .select("id, nom, prenom")
    .eq("role", "agriculteur")
    .order("nom", { ascending: true });

  if (error) {
    throw new Error(error.message || "Impossible de recuperer les agriculteurs.");
  }

  return (data ?? []) as AgriculteurOption[];
};

export const fetchRoutesForAssociation = async (): Promise<RouteOption[]> => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("routes")
    .select("id, date, transporteur_id, utilisateurs!transporteur_id(nom, prenom)")
    .order("date", { ascending: false });

  if (error) {
    throw new Error(error.message || "Impossible de recuperer les routes.");
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((route) => ({
    id: String(route.id ?? ""),
    date: String(route.date ?? ""),
    transporteur_id: String(route.transporteur_id ?? ""),
    utilisateurs: (route.utilisateurs as RouteOption["utilisateurs"]) ?? null,
  }));
};