import { useMemo, useState } from "react";
import type { PlannedItem } from "@cashflow/core";
import { isRecurring } from "@cashflow/core";
import {
  ForecastScreen,
  InstallmentPlanEditorPanel,
  PlannedItemEditorPanel,
  RecurrenceScopeDialog,
  type ForecastFilter,
  type PlannedItemEditorValues,
  type RecurrenceScope,
} from "@cashflow/ui";
import {
  createEmptyInstallmentPlanInput,
  toInstallmentEditorValues,
  useInstallmentMutations,
} from "../data/mutations/useInstallmentMutations";
import {
  createEmptyPlannedItemInput,
  usePlannedItemMutations,
  type PlannedItemEditorInput,
} from "../data/mutations/usePlannedItemMutations";
import { useForecastScreen } from "../data/queries/useForecastScreen";
import { useAccounts } from "../data/queries/useAccounts";

type EditorKind = "planned" | "installment";

function toPlannedEditorValues(item: PlannedItem): PlannedItemEditorValues {
  return {
    type: item.type,
    amountCents: item.amountCents,
    accountId: item.accountId,
    toAccountId: item.toAccountId,
    categoryId: item.categoryId,
    description: item.description,
    recurrence: item.recurrence,
    interval: item.interval,
    dayOfMonth: item.dayOfMonth,
    weekday: item.weekday,
    monthOfYear: item.monthOfYear,
    startDate: item.startDate,
    endDate: item.endDate,
    isSubscription: item.isSubscription,
    isActive: item.isActive,
  };
}

export function ForecastPage() {
  const [filter, setFilter] = useState<ForecastFilter>("all");
  const { data, isPending, isError, error } = useForecastScreen(filter);
  const { data: accountsData } = useAccounts();

  const plannedMutations = usePlannedItemMutations();
  const installmentMutations = useInstallmentMutations();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKind, setEditorKind] = useState<EditorKind>("planned");
  const [editorMode, setEditorMode] = useState<"create" | "edit">("create");
  const [editingPlannedId, setEditingPlannedId] = useState<string | null>(null);
  const [editingInstallmentId, setEditingInstallmentId] = useState<string | null>(null);
  const [plannedValues, setPlannedValues] = useState<PlannedItemEditorValues>(() =>
    createEmptyPlannedItemInput(),
  );
  const [installmentValues, setInstallmentValues] = useState(() =>
    createEmptyInstallmentPlanInput(),
  );
  const [scopeDialogOpen, setScopeDialogOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState<PlannedItemEditorInput | null>(null);
  const [scopeOccurrenceDate, setScopeOccurrenceDate] = useState<string>("");

  const defaultAccountId = data?.accountOptions[0]?.id;

  const openCreatePlanned = () => {
    setEditorKind("planned");
    setEditorMode("create");
    setEditingPlannedId(null);
    setEditingInstallmentId(null);
    setPlannedValues(createEmptyPlannedItemInput(defaultAccountId));
    setEditorOpen(true);
  };

  const openCreateInstallment = () => {
    setEditorKind("installment");
    setEditorMode("create");
    setEditingPlannedId(null);
    setEditingInstallmentId(null);
    setInstallmentValues(createEmptyInstallmentPlanInput(defaultAccountId));
    setEditorOpen(true);
  };

  const openEditPlanned = (id: string) => {
    const item = data?.rawPlannedItems.find((row) => row.id === id);
    if (!item) return;
    setEditorKind("planned");
    setEditorMode("edit");
    setEditingPlannedId(id);
    setEditingInstallmentId(null);
    setPlannedValues(toPlannedEditorValues(item));
    setEditorOpen(true);
  };

  const openEditInstallment = (id: string) => {
    const plan = data?.rawInstallmentPlans.find((row) => row.id === id);
    if (!plan) return;
    setEditorKind("installment");
    setEditorMode("edit");
    setEditingInstallmentId(id);
    setEditingPlannedId(null);
    setInstallmentValues(toInstallmentEditorValues(plan));
    setEditorOpen(true);
  };

  const handlePlannedSave = async () => {
    const input: PlannedItemEditorInput = { ...plannedValues };
    if (!input.description.trim() || input.amountCents <= 0) return;

    if (editorMode === "create") {
      await plannedMutations.create.mutateAsync(input);
      setEditorOpen(false);
      return;
    }

    if (!editingPlannedId) return;
    const original = data?.rawPlannedItems.find((row) => row.id === editingPlannedId);
    if (!original) return;

    if (!isRecurring(original.recurrence)) {
      await plannedMutations.update.mutateAsync({ id: editingPlannedId, input });
      setEditorOpen(false);
      return;
    }

    const next = data?.allPlannedRows.find((row) => row.id === editingPlannedId);
    const occurrenceDate = next?.nextDate ?? original.startDate;
    setPendingSave(input);
    setScopeOccurrenceDate(occurrenceDate);
    setScopeDialogOpen(true);
  };

  const handleScopeConfirm = async (scope: RecurrenceScope) => {
    if (!editingPlannedId || !pendingSave) return;
    const original = data?.rawPlannedItems.find((row) => row.id === editingPlannedId);
    if (!original) return;

    await plannedMutations.saveWithScope.mutateAsync({
      id: editingPlannedId,
      input: pendingSave,
      scope,
      occurrenceDate: scopeOccurrenceDate,
      original,
    });

    setScopeDialogOpen(false);
    setPendingSave(null);
    setEditorOpen(false);
  };

  const handleInstallmentSave = async () => {
    if (!installmentValues.description.trim() || installmentValues.installmentAmountCents <= 0) {
      return;
    }

    if (editorMode === "create") {
      await installmentMutations.create.mutateAsync(installmentValues);
    } else if (editingInstallmentId) {
      await installmentMutations.update.mutateAsync({
        id: editingInstallmentId,
        input: installmentValues,
      });
    }
    setEditorOpen(false);
  };

  const occurrencePreview = useMemo(() => {
    if (!editingPlannedId || !data) return [];
    return data.previewOccurrences(editingPlannedId);
  }, [data, editingPlannedId]);

  const schedulePreview = useMemo(() => {
    if (!editingInstallmentId || !data) return [];
    const plan = data.allInstallmentRows.find((row) => row.id === editingInstallmentId);
    return plan?.installments ?? [];
  }, [data, editingInstallmentId]);

  return (
    <>
      <ForecastScreen
        plannedRows={data?.plannedRows ?? []}
        installmentRows={data?.installmentRows ?? []}
        allPlannedRows={data?.allPlannedRows ?? []}
        allInstallmentRows={data?.allInstallmentRows ?? []}
        summary={
          data?.summary ?? {
            activeItemCount: 0,
            subscriptionCount: 0,
            nextOutflow: null,
            nextInflow: null,
          }
        }
        filter={filter}
        workingBalanceCents={accountsData?.workingBalanceCents ?? 0}
        status={isPending ? "loading" : isError ? "error" : "ready"}
        errorMessage={error instanceof Error ? error.message : undefined}
        onFilterChange={setFilter}
        onAddForecastItem={openCreatePlanned}
        onAddInstallmentPlan={openCreateInstallment}
        onPlannedActiveChange={(id, isActive) =>
          plannedMutations.setActive.mutate({ id, isActive })
        }
        onInstallmentActiveChange={(id, isActive) =>
          installmentMutations.setActive.mutate({ id, isActive })
        }
        onEditPlanned={openEditPlanned}
        onEditInstallment={openEditInstallment}
        onMarkInstallmentPaid={(installmentId) =>
          installmentMutations.markPaid.mutate(installmentId)
        }
        editor={
          editorKind === "planned" ? (
            <PlannedItemEditorPanel
              open={editorOpen}
              mode={editorMode}
              values={plannedValues}
              accountOptions={data?.accountOptions ?? []}
              categoryOptions={data?.categoryOptions ?? []}
              occurrencePreview={occurrencePreview}
              onChange={(patch) => setPlannedValues((current) => ({ ...current, ...patch }))}
              onClose={() => setEditorOpen(false)}
              onSave={handlePlannedSave}
              onDelete={
                editorMode === "edit" && editingPlannedId
                  ? async () => {
                      await plannedMutations.remove.mutateAsync(editingPlannedId);
                      setEditorOpen(false);
                    }
                  : undefined
              }
            />
          ) : (
            <InstallmentPlanEditorPanel
              open={editorOpen}
              mode={editorMode}
              values={installmentValues}
              accountOptions={data?.accountOptions ?? []}
              categoryOptions={(data?.categoryOptions ?? []).map((c) => ({
                id: c.id,
                name: c.name,
              }))}
              schedulePreview={schedulePreview}
              onChange={(patch) => setInstallmentValues((current) => ({ ...current, ...patch }))}
              onClose={() => setEditorOpen(false)}
              onSave={handleInstallmentSave}
              onDelete={
                editorMode === "edit" && editingInstallmentId
                  ? async () => {
                      await installmentMutations.remove.mutateAsync(editingInstallmentId);
                      setEditorOpen(false);
                    }
                  : undefined
              }
            />
          )
        }
      />

      <RecurrenceScopeDialog
        open={scopeDialogOpen}
        occurrenceDate={scopeOccurrenceDate}
        onConfirm={handleScopeConfirm}
        onCancel={() => {
          setScopeDialogOpen(false);
          setPendingSave(null);
        }}
      />
    </>
  );
}
