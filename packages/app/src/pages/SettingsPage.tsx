import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Language, Settings } from "@cashflow/core";
import { messagesFor } from "@cashflow/core";
import { SettingsScreen, type SettingsBanner, type SettingsDraft } from "@cashflow/ui";
import { useAccounts } from "../data/queries/useAccounts";
import { useSettings } from "../data/queries/useSettings";
import { useSettingsMutations, SettingsImportError } from "../data/mutations/useSettingsMutations";

function toDraft(settings: Settings): SettingsDraft {
  return {
    language: settings.language,
    dateFormat: settings.dateFormat,
    negativeBufferCents: settings.negativeBufferCents,
    largeOutflowThresholdCents: settings.largeOutflowThresholdCents,
    horizonMonths: settings.horizonMonths,
    defaultWorkingForType: { ...settings.defaultWorkingForType },
  };
}

function draftToPatch(draft: SettingsDraft): Partial<Settings> {
  return {
    language: draft.language,
    dateFormat: draft.dateFormat,
    negativeBufferCents: draft.negativeBufferCents,
    largeOutflowThresholdCents: draft.largeOutflowThresholdCents,
    horizonMonths: draft.horizonMonths,
    defaultWorkingForType: draft.defaultWorkingForType,
  };
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { data: settings, isPending, isError, error } = useSettings();
  const { data: accountsData } = useAccounts();
  const { update, exportBackup, importBackup } = useSettingsMutations();
  const [draft, setDraft] = useState<SettingsDraft | null>(null);
  const [banner, setBanner] = useState<SettingsBanner>(null);
  const [importFileName, setImportFileName] = useState<string | null>(null);

  useEffect(() => {
    if (settings && draft === null) {
      setDraft(toDraft(settings));
    }
  }, [settings, draft]);

  const language = draft?.language ?? settings?.language ?? "pt-BR";

  const handleLanguageChange = async (nextLanguage: Language) => {
    setDraft((current) => (current ? { ...current, language: nextLanguage } : current));
    await update.mutateAsync({ language: nextLanguage });
  };

  const handleSave = async () => {
    if (!draft) return;
    const saved = await update.mutateAsync(draftToPatch(draft));
    setDraft(toDraft(saved));
    const m = messagesFor(saved.language);
    setBanner({
      kind: "success",
      title: m.settings.savedTitle,
      description: m.settings.savedDesc,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleExport = async () => {
    await exportBackup.mutateAsync();
  };

  const handleImport = async (file: File) => {
    setImportFileName(file.name);
    try {
      const saved = await importBackup.mutateAsync(file);
      setDraft(toDraft(saved));
      const m = messagesFor(language);
      setBanner({
        kind: "success",
        title: m.settings.restoredTitle,
        description: m.settings.restoredDesc,
      });
    } catch (err) {
      const m = messagesFor(language);
      const description =
        err instanceof SettingsImportError
          ? err.code === "invalidJson"
            ? m.common.errors.invalidJson
            : m.common.errors.invalidBackupFormat
          : m.settings.importFailedDesc;
      setBanner({
        kind: "error",
        title: m.settings.importFailedTitle,
        description,
      });
    }
  };

  if (isPending || !draft) {
    return (
      <SettingsScreen
        draft={{
          language,
          dateFormat: settings?.dateFormat ?? "DD/MM/YYYY",
          negativeBufferCents: settings?.negativeBufferCents ?? 0,
          largeOutflowThresholdCents: settings?.largeOutflowThresholdCents ?? 50_000,
          horizonMonths: settings?.horizonMonths ?? 24,
          defaultWorkingForType: settings?.defaultWorkingForType ?? {},
        }}
        workingBalanceCents={accountsData?.workingBalanceCents ?? 0}
        status="loading"
        onDraftChange={() => undefined}
        onLanguageChange={() => undefined}
        onSave={() => undefined}
        onExport={() => undefined}
        onImport={() => undefined}
      />
    );
  }

  return (
    <SettingsScreen
      draft={draft}
      workingBalanceCents={accountsData?.workingBalanceCents ?? 0}
      status={isError ? "error" : "ready"}
      errorMessage={error instanceof Error ? error.message : undefined}
      banner={banner}
      isSaving={update.isPending}
      isExporting={exportBackup.isPending}
      importFileName={importFileName}
      onDraftChange={(patch) =>
        setDraft((current) => (current ? { ...current, ...patch } : current))
      }
      onLanguageChange={handleLanguageChange}
      onSave={handleSave}
      onExport={handleExport}
      onImport={handleImport}
      onDismissBanner={() => setBanner(null)}
      onBackToCalendar={() => navigate({ to: "/year" })}
    />
  );
}
