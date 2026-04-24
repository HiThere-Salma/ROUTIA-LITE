/**
 * Service de geocodage — Mapbox Geocoding API
 * Cle API a definir dans .env : VITE_MAPBOX_KEY
 */

export type GeoCoords = {
  lat: number;
  lng: number;
};

export type MapboxAddressSuggestion = {
  id: string;
  label: string;
  address: string;
  coords: GeoCoords;
};

const RAW_MAPBOX_KEY = import.meta.env.VITE_MAPBOX_KEY as string | undefined;
const MAPBOX_ACCESS_TOKEN = RAW_MAPBOX_KEY?.trim() || "";


type SuggestionSearchOptions = {
  limit: number;
  autocomplete: boolean;
  fuzzyMatch: boolean;
};

type QueryPrecision = {
  isPrecise: boolean;
  isVeryPrecise: boolean;
};

export function isMapboxConfigured(): boolean {
  return MAPBOX_ACCESS_TOKEN.length > 0;
}

export function getMapboxConfigError(): string | null {
  if (isMapboxConfigured()) return null;
  return "Configuration Mapbox manquante: ajoutez VITE_MAPBOX_KEY dans le fichier .env";
}

function normalizeAddressValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s,.-]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function getQueryPrecision(query: string): QueryPrecision {
  const normalized = normalizeAddressValue(query);
  const tokenCount = normalized.split(/[\s,.-]+/).filter(Boolean).length;
  const hasStreetNumber = /\d/.test(normalized);
  const hasSeparators = /,|-/.test(normalized);
  const isVeryPrecise = normalized.length >= 22 && tokenCount >= 4 && hasStreetNumber && hasSeparators;
  const isPrecise = normalized.length >= 14 && tokenCount >= 3 && hasStreetNumber;
  return { isPrecise, isVeryPrecise };
}

export function isLikelyCompleteAddress(query: string): boolean {
  return getQueryPrecision(query).isVeryPrecise;
}

function computeSearchOptions(query: string, requestedLimit: number): SuggestionSearchOptions {
  const { isPrecise, isVeryPrecise } = getQueryPrecision(query);

  if (isVeryPrecise) {
    return { limit: 1, autocomplete: false, fuzzyMatch: false };
  }
  if (isPrecise) {
    return { limit: Math.min(Math.max(requestedLimit, 1), 2), autocomplete: true, fuzzyMatch: false };
  }
  return {
    limit: Math.min(Math.max(requestedLimit, 1), 6),
    autocomplete: true,
    fuzzyMatch: true,
  };
}

function getMapboxUrl(query: string, options: SuggestionSearchOptions) {
  const safeLimit = Math.min(Math.max(options.limit, 1), 10);
  const params = new URLSearchParams({
    access_token: MAPBOX_ACCESS_TOKEN,
    autocomplete: String(options.autocomplete),
    language: "fr",
    //bbox: AMERICAS_BBOX,
    proximity: "-95,20",
    types: "address,place,locality,postcode,neighborhood,district",
    fuzzyMatch: String(options.fuzzyMatch),
    limit: String(safeLimit),
  });

  return `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?${params.toString()}`;
}

/**
 * Recherche d'adresses pour autocomplete.
 */
export async function searchAddressSuggestions(query: string, limit = 5): Promise<MapboxAddressSuggestion[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [];
  const searchOptions = computeSearchOptions(trimmedQuery, limit);
  const normalizedQuery = normalizeAddressValue(trimmedQuery);

  const configError = getMapboxConfigError();
  if (configError) {
    throw new Error(configError);
  }

  try {
    const response = await fetch(getMapboxUrl(trimmedQuery, searchOptions), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      let mapboxMessage = "";
      try {
        const errorJson = (await response.json()) as { message?: string };
        mapboxMessage = errorJson.message ?? "";
      } catch {
        mapboxMessage = "";
      }
      throw new Error(
        mapboxMessage
          ? `Mapbox: ${mapboxMessage}`
          : `Mapbox a retourne une erreur (${response.status}).`
      );
    }

    const json = (await response.json()) as {
      features?: Array<{
        id: string;
        place_name: string;
        center?: [number, number];
      }>;
    };

    const mapped = (json.features ?? [])
      .filter((feature) => Array.isArray(feature.center) && feature.center.length === 2)
      .map((feature) => ({
        id: feature.id,
        label: feature.place_name,
        address: feature.place_name,
        coords: {
          lng: feature.center![0],
          lat: feature.center![1],
        },
      }));

    // Si la saisie est très précise, on garde uniquement le meilleur match.
    if (searchOptions.limit === 1 || mapped.length <= 1) {
      return mapped.slice(0, searchOptions.limit);
    }

    const scored = mapped
      .map((item) => {
        const normalizedLabel = normalizeAddressValue(item.label);
        let score = 0;
        if (normalizedLabel === normalizedQuery) score += 100;
        if (normalizedLabel.startsWith(normalizedQuery)) score += 50;
        if (normalizedLabel.includes(normalizedQuery)) score += 20;
        return { item, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);

    return scored.slice(0, searchOptions.limit);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Erreur inconnue lors de la recherche d'adresses Mapbox.");
  }
}

/**
 * Geocode une adresse et retourne {lat, lng} ou null si impossible.
 */
export async function geocodeAddress(address: string): Promise<GeoCoords | null> {
  const suggestions = await searchAddressSuggestions(address, 1);
  return suggestions[0]?.coords ?? null;
}

/**
 * Geocode les deux adresses d'une commande en parallele.
 * Retourne les coordonnees de collecte et livraison (null si introuvable).
 */
export async function geocodeCommandeAddresses(
  adresseCollecte: string,
  adresseLivraison: string
): Promise<{
  collecte: GeoCoords | null;
  livraison: GeoCoords | null;
}> {
  const [collecte, livraison] = await Promise.all([
    geocodeAddress(adresseCollecte),
    geocodeAddress(adresseLivraison),
  ]);
  return { collecte, livraison };
}
