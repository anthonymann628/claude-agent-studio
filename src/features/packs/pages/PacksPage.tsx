import React, { useEffect, useState } from "react";
import { save, open } from "@tauri-apps/plugin-dialog";
import { useCatalogStore } from "../../../state/catalogStore";
import { useInstallStore } from "../../../state/installStore";
import { tauriCommands } from "../../../lib/tauri";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Button } from "../../../components/ui/Button";
import { DEFAULT_CATALOG_SOURCES, resolveCatalogPath } from "../../../lib/constants/defaultSources";
import type { Pack, PackExport } from "../../../domain/packs/models";

export function PacksPage() {
  const { packs, loading, error, loadCatalog } = useCatalogStore();
  const { isInstalled, installPack, loadInstalledIds } = useInstallStore();

  const [expandedPacks, setExpandedPacks] = useState<Set<string>>(new Set());
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [installResults, setInstallResults] = useState<
    Record<string, "success" | "error">
  >({});
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<PackExport | null>(null);
  const [importingPack, setImportingPack] = useState(false);

  const defaultSource = DEFAULT_CATALOG_SOURCES[0];
  const catalogPath = defaultSource ? resolveCatalogPath(defaultSource) : "";
  const sourceId = defaultSource?.id ?? "official";

  useEffect(() => {
    if (catalogPath) {
      loadCatalog(catalogPath);
    }
    loadInstalledIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogPath]);

  const togglePack = (packId: string) => {
    setExpandedPacks((prev) => {
      const next = new Set(prev);
      if (next.has(packId)) next.delete(packId);
      else next.add(packId);
      return next;
    });
  };

  const countInstalled = (pack: Pack): number =>
    pack.agents.filter((id) => isInstalled(id)).length;

  const handleInstallPack = async (pack: Pack) => {
    setInstallingId(pack.id);
    try {
      await installPack(sourceId, catalogPath, pack.agents);
      setInstallResults((prev) => ({ ...prev, [pack.id]: "success" }));
    } catch {
      setInstallResults((prev) => ({ ...prev, [pack.id]: "error" }));
    } finally {
      setInstallingId(null);
    }
  };

  const handleExportPack = async (pack: Pack) => {
    setExportingId(pack.id);
    try {
      const exportPath = await save({
        defaultPath: `${pack.id}-pack.json`,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (!exportPath) return;

      const packExport: PackExport = {
        id: pack.id,
        name: pack.name,
        version: pack.version,
        description: pack.description,
        rationale: pack.rationale,
        agents: pack.agents,
        exportedAt: new Date().toISOString(),
      };
      await tauriCommands.exportPackToFile(
        JSON.stringify(packExport, null, 2),
        exportPath,
      );
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExportingId(null);
    }
  };

  const handleImportPack = async () => {
    try {
      const selected = await open({
        filters: [{ name: "JSON", extensions: ["json"] }],
        multiple: false,
      });
      if (!selected || typeof selected !== "string") return;

      const imported = await tauriCommands.importPackFromFile(selected);
      setImportPreview(imported);
    } catch (err) {
      console.error("Import failed:", err);
    }
  };

  const handleInstallImported = async () => {
    if (!importPreview) return;
    setImportingPack(true);
    try {
      await installPack(sourceId, catalogPath, importPreview.agents);
      setImportPreview(null);
    } catch (err) {
      console.error("Install imported pack failed:", err);
    } finally {
      setImportingPack(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <h1 className="page-title">Agent Packs</h1>
            <p className="page-subtitle">
              Curated bundles of agents for common workflows. Install an entire
              pack with one click.
            </p>
          </div>
          <Button variant="secondary" onClick={handleImportPack}>
            Import Pack
          </Button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {importPreview && (
        <div className="import-preview">
          <div className="import-preview-header">
            <div>
              <span style={{ fontWeight: 600, color: "var(--color-text)" }}>
                {importPreview.name}
              </span>
              <span
                style={{
                  marginLeft: 8,
                  fontSize: "0.75rem",
                  color: "var(--color-text-faint)",
                }}
              >
                v{importPreview.version} &middot; {importPreview.agents.length}{" "}
                agents
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setImportPreview(null)}
              >
                Dismiss
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={importingPack}
                onClick={handleInstallImported}
              >
                {importingPack ? "Installing…" : "Install Pack"}
              </Button>
            </div>
          </div>
          <p
            style={{
              fontSize: "0.83rem",
              color: "var(--color-text-muted)",
              margin: "8px 0 10px",
            }}
          >
            {importPreview.description}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {importPreview.agents.map((agentId) => (
              <span
                key={agentId}
                className={`pack-agent-tag${isInstalled(agentId) ? " pack-agent-tag-installed" : ""}`}
              >
                {agentId}
                {isInstalled(agentId) && (
                  <span
                    style={{ marginLeft: 4, color: "var(--color-success)" }}
                  >
                    ✓
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner label="Loading packs…" />
      ) : packs.length === 0 ? (
        <EmptyState
          icon="📦"
          title="No packs available"
          message="Packs will appear here once the catalog is loaded."
        />
      ) : (
        <div>
          {packs.map((pack) => {
            const isExpanded = expandedPacks.has(pack.id);
            const isInstalling = installingId === pack.id;
            const result = installResults[pack.id];
            const installedCount = countInstalled(pack);
            const allInstalled = installedCount === pack.agents.length;

            return (
              <div key={pack.id} className="pack-card">
                <div
                  className="pack-card-header"
                  onClick={() => togglePack(pack.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") togglePack(pack.id);
                  }}
                  aria-expanded={isExpanded}
                >
                  <div className="pack-card-info">
                    <div className="pack-card-title">
                      {pack.name}
                      <span
                        style={{
                          marginLeft: 10,
                          fontSize: "0.75rem",
                          color: "var(--color-text-faint)",
                        }}
                      >
                        v{pack.version} &middot; {pack.agents.length} agents
                      </span>
                      {installedCount > 0 && (
                        <span
                          className={`badge ${allInstalled ? "badge-green" : "badge-default"}`}
                          style={{ marginLeft: 8 }}
                        >
                          {installedCount}/{pack.agents.length} installed
                        </span>
                      )}
                    </div>
                    <p className="pack-card-desc">{pack.description}</p>
                    {pack.rationale && (
                      <p className="pack-card-rationale">
                        "{pack.rationale}"
                      </p>
                    )}
                  </div>
                  <div
                    style={{ display: "flex", gap: 8, flexShrink: 0 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {result === "success" && (
                      <span
                        className="badge badge-green"
                        style={{ alignSelf: "center" }}
                      >
                        Installed
                      </span>
                    )}
                    {result === "error" && (
                      <span
                        className="badge badge-red"
                        style={{ alignSelf: "center" }}
                      >
                        Failed
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={exportingId === pack.id}
                      onClick={() => handleExportPack(pack)}
                    >
                      {exportingId === pack.id ? "Exporting…" : "Export"}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={isInstalling || allInstalled}
                      onClick={() => handleInstallPack(pack)}
                    >
                      {isInstalling
                        ? "Installing…"
                        : allInstalled
                        ? "Installed"
                        : "Install Pack"}
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pack-card-body">
                    <div
                      style={{
                        fontSize: "0.78rem",
                        color: "var(--color-text-faint)",
                        marginBottom: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        fontWeight: 600,
                      }}
                    >
                      Included Agents
                    </div>
                    <ul className="pack-agent-list">
                      {pack.agents.map((agentId) => {
                        const installed = isInstalled(agentId);
                        return (
                          <li
                            key={agentId}
                            className={`pack-agent-tag${installed ? " pack-agent-tag-installed" : ""}`}
                          >
                            {agentId}
                            {installed && (
                              <span
                                style={{
                                  marginLeft: 5,
                                  color: "var(--color-success)",
                                  fontSize: "0.7rem",
                                }}
                              >
                                ✓
                              </span>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
