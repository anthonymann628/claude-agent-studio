export type CatalogSource = {
  id: string;
  name: string;
  kind: "official" | "community" | "personal" | "team" | "local";
  manifestUrl?: string;
  localPath?: string;
  enabled: boolean;
};

export type CatalogAgentEntry = {
  id: string;
  name: string;
  category?: string;
  model?: string;
  description?: string;
  file: string;
};

export type CatalogManifest = {
  name: string;
  version: string;
  agents: CatalogAgentEntry[];
};
