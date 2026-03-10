import { create } from "zustand";
import type { UpdateCandidate, UpdateInfo } from "../domain/updates/models";
import type { CatalogSource, InstallRecord } from "../domain/catalogs/models";
import { tauriCommands } from "../lib/tauri";

interface UpdateStore {
  updates: UpdateCandidate[];
  loading: boolean;
  checking: boolean;
  error: string | null;
  checkForUpdates: () => Promise<void>;
  applyUpdate: (update: UpdateCandidate) => Promise<void>;
  applyAllUpdates: () => Promise<void>;
}

/** Resolve catalogPath and agentFile for an update candidate from live registry/sources. */
async function resolveUpdateInfo(
  candidate: UpdateCandidate,
): Promise<{ catalogPath: string; agentFile: string }> {
  const [registry, sources] = await Promise.all([
    tauriCommands.getInstallRegistry(),
    tauriCommands.listSources(),
  ]);

  const record: InstallRecord | undefined = registry.records.find(
    (r) => r.agentId === candidate.agentId,
  );
  const source: CatalogSource | undefined = sources.find(
    (s) => s.id === candidate.sourceId,
  );

  const agentFile = record?.originalFile ?? "";
  const catalogPath = source?.manifestUrl ?? source?.localPath ?? "";

  return { catalogPath, agentFile };
}

export const useUpdateStore = create<UpdateStore>((set, get) => ({
  updates: [],
  loading: false,
  checking: false,
  error: null,

  checkForUpdates: async () => {
    set({ checking: true, error: null });
    try {
      const updates = await tauriCommands.checkUpdates();
      set({ updates, checking: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to check for updates";
      set({ checking: false, error: message });
    }
  },

  applyUpdate: async (update) => {
    set({ loading: true, error: null });
    try {
      const { catalogPath, agentFile } = await resolveUpdateInfo(update);
      await tauriCommands.applyUpdate(
        update.agentId,
        update.sourceId,
        catalogPath,
        agentFile,
      );
      set((state) => ({
        updates: state.updates.filter((u) => u.agentId !== update.agentId),
        loading: false,
      }));
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to apply update";
      set({ loading: false, error: message });
      throw err;
    }
  },

  applyAllUpdates: async () => {
    set({ loading: true, error: null });
    try {
      const { updates } = get();
      const [registry, sources] = await Promise.all([
        tauriCommands.getInstallRegistry(),
        tauriCommands.listSources(),
      ]);

      const updateInfos: UpdateInfo[] = updates.map((u) => {
        const record: InstallRecord | undefined = registry.records.find(
          (r) => r.agentId === u.agentId,
        );
        const source: CatalogSource | undefined = sources.find(
          (s) => s.id === u.sourceId,
        );
        return {
          agentId: u.agentId,
          sourceId: u.sourceId,
          catalogPath: source?.manifestUrl ?? source?.localPath ?? "",
          agentFile: record?.originalFile ?? "",
        };
      });

      await tauriCommands.applyAllUpdates(updateInfos);
      set({ updates: [], loading: false });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to apply updates";
      set({ loading: false, error: message });
      throw err;
    }
  },
}));
