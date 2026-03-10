import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCatalogStore } from "../../../state/catalogStore";
import { useInstallStore } from "../../../state/installStore";
import { useSourceStore } from "../../../state/sourceStore";
import { SearchBar } from "../../../components/ui/SearchBar";
import { LoadingSpinner } from "../../../components/ui/LoadingSpinner";
import { EmptyState } from "../../../components/ui/EmptyState";
import { Button } from "../../../components/ui/Button";
import { CategoryBadge } from "../../../components/ui/CategoryBadge";
import { DEFAULT_CATALOG_SOURCES, resolveCatalogPath } from "../../../lib/constants/defaultSources";
import type { CatalogAgentEntry } from "../../../domain/catalogs/models";

export function CatalogPage() {
  const navigate = useNavigate();
  const {
    manifest,
    loading,
    error,
    selectedCategory,
    searchQuery,
    loadCatalog,
    setCategory,
    setSearch,
    filteredAgents,
  } = useCatalogStore();

  const { isInstalled, installAgent, installMultiple, loadInstalledIds } =
    useInstallStore();
  const { sources, loadSources } = useSourceStore();

  const [selectedSourceId, setSelectedSourceId] = useState<string>(
    DEFAULT_CATALOG_SOURCES[0]?.id ?? "official",
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [multiSelect, setMultiSelect] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);
  const [bulkInstalling, setBulkInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  const activeSources =
    sources.length > 0
      ? sources.filter((s) => s.enabled)
      : DEFAULT_CATALOG_SOURCES;

  const currentSource =
    activeSources.find((s) => s.id === selectedSourceId) ??
    activeSources[0] ??
    DEFAULT_CATALOG_SOURCES[0];
  const catalogPath = currentSource ? resolveCatalogPath(currentSource) : "";

  useEffect(() => {
    loadSources();
    loadInstalledIds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (catalogPath) {
      loadCatalog(catalogPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogPath]);

  // Reset selection when leaving multi-select mode
  useEffect(() => {
    if (!multiSelect) setSelectedIds(new Set());
  }, [multiSelect]);

  const agents = filteredAgents();

  const categoryCounts: Record<string, number> = {};
  if (manifest) {
    for (const a of manifest.agents) {
      if (a.category) {
        categoryCounts[a.category] = (categoryCounts[a.category] ?? 0) + 1;
      }
    }
  }
  const categories = Object.keys(categoryCounts).sort();

  const toggleSelect = (agentId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(agentId)) next.delete(agentId);
      else next.add(agentId);
      return next;
    });
  };

  const handleInstall = async (agent: CatalogAgentEntry) => {
    setInstallingId(agent.id);
    setInstallError(null);
    try {
      await installAgent(currentSource.id, catalogPath, agent.file);
    } catch (err) {
      setInstallError(
        err instanceof Error ? err.message : "Installation failed.",
      );
    } finally {
      setInstallingId(null);
    }
  };

  const handleBulkInstall = async () => {
    const toInstall = agents.filter(
      (a) => selectedIds.has(a.id) && !isInstalled(a.id),
    );
    if (toInstall.length === 0) return;

    setBulkInstalling(true);
    setInstallError(null);
    try {
      await installMultiple(
        currentSource.id,
        catalogPath,
        toInstall.map((a) => a.file),
      );
      setSelectedIds(new Set());
      setMultiSelect(false);
    } catch (err) {
      setInstallError(
        err instanceof Error ? err.message : "Bulk installation failed.",
      );
    } finally {
      setBulkInstalling(false);
    }
  };

  const uninstalledSelected = agents.filter(
    (a) => selectedIds.has(a.id) && !isInstalled(a.id),
  ).length;

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Catalog</h1>
        <p className="page-subtitle">
          {manifest
            ? `${manifest.agents.length} agents available`
            : "Browse and install agents from the official catalog."}
        </p>
      </div>

      {(error || installError) && (
        <div className="error-banner">{error ?? installError}</div>
      )}

      <div className="toolbar">
        <div className="toolbar-search">
          <SearchBar
            value={searchQuery}
            onChange={setSearch}
            placeholder="Search catalog…"
          />
        </div>

        {activeSources.length > 1 && (
          <select
            className="input"
            style={{ width: "auto", minWidth: 160 }}
            value={selectedSourceId}
            onChange={(e) => setSelectedSourceId(e.target.value)}
          >
            {activeSources.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        <Button
          variant={multiSelect ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMultiSelect((v) => !v)}
        >
          {multiSelect ? "Cancel Select" : "Multi-select"}
        </Button>
      </div>

      {multiSelect && selectedIds.size > 0 && (
        <div className="selection-toolbar">
          <span style={{ fontSize: "0.85rem", color: "var(--color-text-muted)" }}>
            {selectedIds.size} selected
            {uninstalledSelected < selectedIds.size && ` (${selectedIds.size - uninstalledSelected} already installed)`}
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={bulkInstalling || uninstalledSelected === 0}
              onClick={handleBulkInstall}
            >
              {bulkInstalling
                ? "Installing…"
                : `Install Selected (${uninstalledSelected})`}
            </Button>
          </div>
        </div>
      )}

      {categories.length > 0 && (
        <div className="chip-row">
          <button
            className={`chip${selectedCategory === null ? " active" : ""}`}
            onClick={() => setCategory(null)}
          >
            All
            {manifest && (
              <span style={{ marginLeft: 4, opacity: 0.6 }}>
                {manifest.agents.length}
              </span>
            )}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`chip${selectedCategory === cat ? " active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              {cat}
              <span style={{ marginLeft: 4, opacity: 0.6 }}>
                {categoryCounts[cat]}
              </span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingSpinner label="Loading catalog…" />
      ) : agents.length === 0 ? (
        <EmptyState
          icon="📚"
          title="No agents found"
          message={
            searchQuery || selectedCategory
              ? "Try adjusting your search or category filter."
              : "The catalog appears to be empty or unavailable."
          }
          actionLabel={
            searchQuery || selectedCategory ? "Clear Filters" : undefined
          }
          onAction={
            searchQuery || selectedCategory
              ? () => {
                  setSearch("");
                  setCategory(null);
                }
              : undefined
          }
        />
      ) : (
        <div className="card-grid">
          {agents.map((agent) => {
            const installed = isInstalled(agent.id);
            const isInstalling = installingId === agent.id;
            const isChecked = selectedIds.has(agent.id);

            return (
              <div
                key={agent.id}
                className={`card card-clickable${isChecked ? " card-selected" : ""}`}
                onClick={() => {
                  if (multiSelect) {
                    toggleSelect(agent.id);
                  } else {
                    navigate(`/catalog/${agent.id}`);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    if (multiSelect) toggleSelect(agent.id);
                    else navigate(`/catalog/${agent.id}`);
                  }
                }}
              >
                {multiSelect && (
                  <label
                    className="checkbox"
                    onClick={(e) => e.stopPropagation()}
                    style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(agent.id)}
                    />
                    <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                      Select
                    </span>
                  </label>
                )}

                <div className="card-title">{agent.name}</div>
                {agent.description && (
                  <p className="card-description">{agent.description}</p>
                )}
                <div className="card-footer">
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {agent.category && <CategoryBadge category={agent.category} />}
                    {installed && (
                      <span className="badge badge-green">Installed</span>
                    )}
                  </div>
                  {!multiSelect && (
                    <Button
                      variant={installed ? "ghost" : "primary"}
                      size="sm"
                      disabled={isInstalling || installed}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!installed) handleInstall(agent);
                      }}
                    >
                      {isInstalling
                        ? "Installing…"
                        : installed
                        ? "Installed"
                        : "Install"}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
