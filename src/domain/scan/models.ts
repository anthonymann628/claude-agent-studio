export type DetectedItem = {
  id: string;
  label: string;
  confidence: number;
  source: string[];
};

export type EvidenceRecord = {
  signal: string;
  file: string;
  type: "file" | "dependency" | "text" | "path" | "config";
  weight: number;
};

export type ProjectProfile = {
  projectTypes: DetectedItem[];
  languages: DetectedItem[];
  frameworks: DetectedItem[];
  infrastructure: DetectedItem[];
  integrations: DetectedItem[];
  workflowSignals: DetectedItem[];
  domainSignals: DetectedItem[];
  evidence: EvidenceRecord[];
};
