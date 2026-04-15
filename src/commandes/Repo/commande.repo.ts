import { getSupabaseClient } from "../../lib/supabase/supabase.client"

export const fetchAllCommandes = async () => {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.from("vue_commandes").select("*");
  console.log("Fetched commandes:", data);

    if (error) {
        throw new Error(error.message || "Impossible de recuperer les commandes.");
    }

    return data;
};