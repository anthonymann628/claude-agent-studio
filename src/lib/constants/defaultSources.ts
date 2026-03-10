import type { CatalogSource } from "../../domain/catalogs/models";

/** Single source of truth for the official catalog base URL. */
export const OFFICIAL_CATALOG_URL =
  "https://raw.githubusercontent.com/anthonymann628/claude-agent-catalog/main";

export const DEFAULT_CATALOG_SOURCES: CatalogSource[] = [
  {
    id: "official",
    name: "Official Catalog",
    kind: "official",
    manifestUrl: OFFICIAL_CATALOG_URL,
    localPath: "catalogs/official",
    enabled: true,
  },
];

/**
 * Resolve the best catalog path for a CatalogSource.
 * Prefers remote manifestUrl for sources that have one, falls back to localPath.
 */
export function resolveCatalogPath(source: CatalogSource): string {
  return source.manifestUrl || source.localPath || "";
}
