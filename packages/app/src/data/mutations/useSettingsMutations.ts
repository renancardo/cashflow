import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Settings } from "@cashflow/core";
import {
  exportDatabase,
  materializeAllCreditCardStatements,
  parseBackupJson,
  restoreDatabase,
  settingsRepo,
  validateBackup,
} from "@cashflow/db";
import { todayIso } from "@cashflow/core";

export class SettingsImportError extends Error {
  constructor(public readonly code: "invalidJson" | "invalidBackupFormat") {
    super(code);
    this.name = "SettingsImportError";
  }
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries();
}

export function useSettingsMutations() {
  const queryClient = useQueryClient();

  const update = useMutation({
    mutationFn: (patch: Partial<Settings>) => settingsRepo.update(patch),
    onSuccess: () => {
      invalidateAll(queryClient);
    },
  });

  const exportBackup = useMutation({
    mutationFn: async () => {
      const backup = exportDatabase();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `cashflow-backup-${todayIso()}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
    },
  });

  const importBackup = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = parseBackupJson(text);
      } catch {
        throw new SettingsImportError("invalidJson");
      }
      if (!validateBackup(parsed)) {
        throw new SettingsImportError("invalidBackupFormat");
      }
      restoreDatabase(parsed);
      await materializeAllCreditCardStatements(todayIso());
      return settingsRepo.get();
    },
    onSuccess: () => {
      invalidateAll(queryClient);
    },
  });

  return { update, exportBackup, importBackup };
}
