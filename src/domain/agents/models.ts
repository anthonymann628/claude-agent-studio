export type AgentMetadata = {
  name: string;
  version: string;
  author?: string;
  category?: string;
  model?: string;
  tools?: string;
  description?: string;
  source?: string;
  status?: string;
  generated_from?: string;
};

export type AgentFile = {
  metadata: AgentMetadata;
  body: string;
  filePath?: string;
};
