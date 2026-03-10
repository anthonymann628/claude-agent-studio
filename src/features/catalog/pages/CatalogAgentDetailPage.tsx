import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useCatalogStore } from "../../../state/catalogStore";
import { useInstallStore } from "../../../state/installStore";
import { tauriCommands } from "../../../lib/tauri";
import { Button } from "../../../components/ui/Button";
import { CategoryBadge } from "../../../components/ui/CategoryBadge";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { DEFAULT_CATALOG_SOURCES, resolveCatalogPath } from "../../../lib/constants/defaultSources";
import type { AgentFile } from "../../../domain/agents/models";

export function CatalogAgentDetailPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();

  const { manifest } = useCatalogStore();
  const { isInstalled, installAgent, loadInstalledIds } = useInstallStore();

  const [agentFile, setAgentFile] = useState<AgentFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);
  const [justInstalled, setJustInstalled] = useState(false);

  const defaultSource = DEFAULT_CATALOG_SOURCES[0];
  const catalogPath = defaultSource ? resolveCatalogPath(defaultSource) : "";
  const sourceId = defaultSource?.id ?? "official";

  const entry = manifest?.agents.find((a) => a.id === agentId);
  const alreadyInstalled = agentId ? isInstalled(agentId) : false;

  useEffect(() => {
    loadInstalledIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!entry || !catalogPath) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    tauriCommands
      .readCatalogAgent(catalogPath, entry.file)
      .then((file) => {
        setAgentFile(file);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load agent.");
        setLoading(false);
      });
  }, [entry, catalogPath]);

  const handleInstall = async () => {
    if (!entry) return;
    setInstalling(true);
    setInstallError(null);
    try {
      await installAgent(sourceId, catalogPath, entry.file);
      setJustInstalled(true);
    } catch (err) {
      setInstallError(
        err instanceof Error ? err.message : "Installation failed."
      );
    } finally {
      setInstalling(false);
    }
  };

  const meta = agentFile?.metadata;

  return (
    <div className="page">
      <button className="back-link" onClick={() => navigate("/catalog")}>
        ← Back to Catalog
      </button>

      {loading ? (
        <LoadingSpinner label="Loading agent…" />
      ) : error ? (
        <div className="error-banner">{error}</div>
      ) : !agentFile || !meta ? (
        <div className="error-banner">Agent not found in catalog.</div>
      ) : (
        <>
          <div className="detail-header">
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <div style={{ flex: 1 }}>
                <h1 className="page-title" style={{ marginBottom: 8 }}>
                  {meta.name}
                </h1>
                {meta.description && (
                  <p style={{ color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
                    {meta.description}
                  </p>
                )}
                <div className="detail-meta-row">
                  {meta.category && <CategoryBadge category={meta.category} />}
                  {meta.version && (
                    <span className="detail-meta-item">v{meta.version}</span>
                  )}
                  {meta.author && (
                    <span className="detail-meta-item">by {meta.author}</span>
                  )}
                  {meta.model && (
                    <span className="detail-meta-item">model: {meta.model}</span>
                  )}
                  {meta.tools && (
                    <span className="detail-meta-item">tools: {meta.tools}</span>
                  )}
                </div>
              </div>

              <div className="catalog-detail-install-bar">
                {(alreadyInstalled || justInstalled) ? (
                  <span className="badge badge-green" style={{ padding: "6px 14px", fontSize: "0.82rem" }}>
                    Installed
                  </span>
                ) : (
                  <Button
                    variant="primary"
                    disabled={installing}
                    onClick={handleInstall}
                  >
                    {installing ? "Installing…" : "Install Agent"}
                  </Button>
                )}
              </div>
            </div>

            {installError && (
              <div className="error-banner" style={{ marginTop: 12, marginBottom: 0 }}>
                {installError}
              </div>
            )}
          </div>

          {agentFile.body && (
            <div className="detail-body">
              <div className="markdown-body">
                <ReactMarkdown>{agentFile.body}</ReactMarkdown>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

