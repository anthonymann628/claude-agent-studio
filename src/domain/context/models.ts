export type ContextField<T = unknown> = {
  value: T;
  confidence?: number;
  source?: string;
};

export type ProjectContext = {
  projectType?: ContextField<string>;
  domain?: ContextField<string>;
  businessModel?: ContextField<string>;
  audience?: ContextField<string>;
  languages?: ContextField<string[]>;
  frameworks?: ContextField<string[]>;
  infrastructure?: ContextField<string[]>;
  integrations?: ContextField<string[]>;
  installedAgents?: ContextField<string[]>;
  installedPacks?: ContextField<string[]>;
};
