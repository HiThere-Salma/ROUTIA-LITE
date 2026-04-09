import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export type SupabaseConfigStatus = {
  isValid: boolean;
  error?: string;
};

const getSupabaseConfigStatus = (): SupabaseConfigStatus => {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      isValid: false,
      error: "SUPABASE_CONFIG_MISSING",
    };
  }

  try {
    new URL(supabaseUrl);
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: "SUPABASE_CONFIG_INVALID",
    };
  }
};

export const supabaseConfigStatus = getSupabaseConfigStatus();

export const supabase = supabaseConfigStatus.isValid
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Centralized accessor so auth/data access stays consistent across the app.
export const getSupabaseClient = () => {
  if (!supabase) {
    throw new Error(supabaseConfigStatus.error ?? "SUPABASE_CONFIG_INVALID");
  }

  return supabase;
};


