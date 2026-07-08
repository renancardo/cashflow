import { useEffect, useMemo, useState } from "react";
import type { PlannedItem } from "@cashflow/core";
import { compareIso, isRecurring } from "@cashflow/core";
import {
  ForecastScreen,
  InstallmentPlanEditorPanel,
  PlannedItemEditorPanel,
  RecurrenceScopeDialog,
  StatementEditorPanel,
  StatementDetailPanel,
  type ForecastFilter,
  type PlannedItemEditorValues,
  type RecurrenceScope,
  type StatementEditorValues,
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
import { useStatementMutations } from "../data/mutations/useStatementMutations";
import { useForecastScreen } from "../data/queries/useForecastScreen";
import { useStatementDetail } from "../data/queries/useStatementDetail";
import { useAccounts } from "../data/queries/useAccounts";

type EditorKind = "planned" | "installment" | "statement";

type ForecastEditorSearch = {
  new?: "planned" | "installment";
  planned?: string;
  installment?: string;
  statement?: string;
};

type Props = {
  editorSearch?: ForecastEditorSearch;
  onEditorSearchChange?: (search: ForecastEditorSearch) => void;
};

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

export function ForecastPage({ editorSearch = {}, onEditorSearchChange }: Props) {
  const [filter, setFilter] = useState<ForecastFilter>("all");
  const [detailStatementId, setDetailStatementId] = useState<string | null>(null);
  const { data, isPending, isError, error } = useForecastScreen(filter);
  const { data: accountsData } = useAccounts();
  const { data: statementDetail, isPending: isDetailPending } =
    useStatementDetail(detailStatementId);

  const plannedMutations = usePlannedItemMutations();
  const installmentMutations = useInstallmentMutations();
  const statementMutations = useStatementMutations();

  const editorOpen = Boolean(
    editorSearch.new ||
      editorSearch.planned ||
      editorSearch.installment ||
      editorSearch.statement,
  );
  const editorKind: EditorKind = editorSearch.statement
    ? "statement"
    : editorSearch.installment || editorSearch.new === "installment"
      ? "installment"
      : "planned";
  const editorMode = editorSearch.new ? "create" : "edit";
  const editingPlannedId = editorSearch.planned ?? null;
  const editingInstallmentId = editorSearch.installment ?? null;
  const editingStatementId = editorSearch.statement ?? null;
  const [statementValues, setStatementValues] = useState<StatementEditorValues>({});
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

  useEffect(() => {
    if (editorSearch.planned) {
      const item = data?.rawPlannedItems.find((row) => row.id === editorSearch.planned);
      if (item) setPlannedValues(toPlannedEditorValues(item));
      return;
    }

    if (editorSearch.installment) {
      const plan = data?.rawInstallmentPlans.find((row) => row.id === editorSearch.installment);
      if (plan) setInstallmentValues(toInstallmentEditorValues(plan));
      return;
    }

    if (editorSearch.statement) {
      const statement = data?.rawStatements.find((row) => row.id === editorSearch.statement);
      if (statement) {
        setStatementValues({
          plannedPaymentCents: statement.plannedPaymentCents,
          payFromAccountId: statement.payFromAccountId,
        });
      }
      return;
    }

    if (editorSearch.new === "planned") {
      setPlannedValues(createEmptyPlannedItemInput(defaultAccountId));
      return;
    }

    if (editorSearch.new === "installment") {
      setInstallmentValues(createEmptyInstallmentPlanInput(defaultAccountId));
    }
  }, [
    editorSearch.new,
    editorSearch.planned,
    editorSearch.installment,
    editorSearch.statement,
    data?.rawPlannedItems,
    data?.rawInstallmentPlans,
    data?.rawStatements,
    defaultAccountId,
  ]);

  const payFromOptions = useMemo(
    () =>
      (accountsData?.rawAccounts ?? [])
        .filter((account) => account.isWorking && account.type !== "credit_card")
        .map((account) => ({ id: account.id, name: account.name })),
    [accountsData?.rawAccounts],
  );

  const editingStatement = useMemo(() => {
    if (!editingStatementId || !data) return null;
    return data.rawStatements.find((row) => row.id === editingStatementId) ?? null;
  }, [data, editingStatementId]);

  const editingStatementCard = useMemo(() => {
    if (!editingStatement || !data) return null;
    return data.rawAccounts.find((row) => row.id === editingStatement.cardAccountId) ?? null;
  }, [data, editingStatement]);

  const includesOpeningDebt = useMemo(() => {
    if (!editingStatement || !editingStatementCard) return false;
    if (editingStatementCard.anchorBalanceCents <= 0) return false;

    const cardStatements = data?.rawStatements
      .filter((row) => row.cardAccountId === editingStatementCard.id)
      .filter(
        (row) =>
          compareIso(row.dueDate, editingStatementCard.anchorDate) >= 0 &&
          compareIso(row.closingDate, editingStatementCard.anchorDate) >= 0,
      )
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    return cardStatements?.[0]?.id === editingStatement.id;
  }, [data?.rawStatements, editingStatement, editingStatementCard]);

  const openCreatePlanned = () => {
    setPlannedValues(createEmptyPlannedItemInput(defaultAccountId));
    onEditorSearchChange?.({ new: "planned" });
  };

  const openCreateInstallment = () => {
    setInstallmentValues(createEmptyInstallmentPlanInput(defaultAccountId));
    onEditorSearchChange?.({ new: "installment" });
  };

  const openEditPlanned = (id: string) => {
    const item = data?.rawPlannedItems.find((row) => row.id === id);
    if (!item) return;
    setPlannedValues(toPlannedEditorValues(item));
    onEditorSearchChange?.({ planned: id });
  };

  const openEditInstallment = (id: string) => {
    const plan = data?.rawInstallmentPlans.find((row) => row.id === id);
    if (!plan) return;
    setInstallmentValues(toInstallmentEditorValues(plan));
    onEditorSearchChange?.({ installment: id });
  };

  const openEditStatement = (id: string) => {
    const statement = data?.rawStatements.find((row) => row.id === id);
    if (!statement) return;
    setStatementValues({
      plannedPaymentCents: statement.plannedPaymentCents,
      payFromAccountId: statement.payFromAccountId,
    });
    onEditorSearchChange?.({ statement: id });
  };

  const closeEditor = () => {
    onEditorSearchChange?.({});
  };

  const handlePlannedSave = async () => {
    const input: PlannedItemEditorInput = { ...plannedValues };
    if (!input.description.trim() || input.amountCents <= 0) return;

    if (editorMode === "create") {
      await plannedMutations.create.mutateAsync(input);
      closeEditor();
      return;
    }

    if (!editingPlannedId) return;
    const original = data?.rawPlannedItems.find((row) => row.id === editingPlannedId);
    if (!original) return;

    if (!isRecurring(original.recurrence)) {
      await plannedMutations.update.mutateAsync({ id: editingPlannedId, input });
      closeEditor();
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
    closeEditor();
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
    closeEditor();
  };

  const handleStatementReset = async () => {
    if (!editingStatementId) return;
    await statementMutations.resetOverride.mutateAsync(editingStatementId);
    setStatementValues((current) => ({ ...current, plannedPaymentCents: undefined }));
  };

  const handleStatementRecordPayment = async () => {
    if (!editingStatementId) return;
    await statementMutations.recordPayment.mutateAsync({
      id: editingStatementId,
      input: statementValues,
    });
    closeEditor();
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
        statementRows={data?.statementRows ?? []}
        allPlannedRows={data?.allPlannedRows ?? []}
        allInstallmentRows={data?.allInstallmentRows ?? []}
        allStatementRows={data?.allStatementRows ?? []}
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
        onMarkPlannedPaid={(plannedItemId, occurrenceDate) =>
          plannedMutations.markPaid.mutate({ plannedItemId, occurrenceDate })
        }
        onEditStatement={openEditStatement}
        onMarkStatementPaid={(statementId) =>
          statementMutations.markPaid.mutate({ id: statementId })
        }
        onViewStatementItems={setDetailStatementId}
        editor={
          editorKind === "planned" ? (
            <PlannedItemEditorPanel
              open={editorOpen}
              mode={editorMode}
              values={plannedValues}
              accountOptions={data?.accountOptions ?? []}
              categoryOptions={data?.categoryOptions ?? []}
              occurrencePreview={occurrencePreview}
              onMarkOccurrencePaid={
                editingPlannedId
                  ? (occurrenceDate) =>
                      plannedMutations.markPaid.mutate({
                        plannedItemId: editingPlannedId,
                        occurrenceDate,
                      })
                  : undefined
              }
              onChange={(patch) => setPlannedValues((current) => ({ ...current, ...patch }))}
              onClose={closeEditor}
              onSave={handlePlannedSave}
              onDelete={
                editorMode === "edit" && editingPlannedId
                  ? async () => {
                      await plannedMutations.remove.mutateAsync(editingPlannedId);
                      closeEditor();
                    }
                  : undefined
              }
            />
          ) : editorKind === "installment" ? (
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
              onClose={closeEditor}
              onSave={handleInstallmentSave}
              onDelete={
                editorMode === "edit" && editingInstallmentId
                  ? async () => {
                      await installmentMutations.remove.mutateAsync(editingInstallmentId);
                      closeEditor();
                    }
                  : undefined
              }
            />
          ) : (
            <StatementEditorPanel
              open={editorOpen}
              cardName={editingStatementCard?.name ?? "Credit card"}
              periodStart={editingStatement?.periodStart ?? ""}
              closingDate={editingStatement?.closingDate ?? ""}
              dueDate={editingStatement?.dueDate ?? ""}
              computedTotalCents={editingStatement?.computedTotalCents ?? 0}
              includesOpeningDebt={includesOpeningDebt}
              values={statementValues}
              status={editingStatement?.status ?? "open"}
              payFromOptions={payFromOptions}
              saving={
                statementMutations.update.isPending ||
                statementMutations.markPaid.isPending ||
                statementMutations.recordPayment.isPending
              }
              onChange={(patch) => setStatementValues((current) => ({ ...current, ...patch }))}
              onClose={closeEditor}
              onResetToFull={handleStatementReset}
              onRecordPayment={handleStatementRecordPayment}
            />
          )
        }
      />

      <StatementDetailPanel
        open={Boolean(detailStatementId)}
        cardName={statementDetail?.cardName ?? ""}
        periodStart={statementDetail?.statement.periodStart ?? ""}
        closingDate={statementDetail?.statement.closingDate ?? ""}
        dueDate={statementDetail?.statement.dueDate ?? ""}
        computedTotalCents={statementDetail?.statement.computedTotalCents ?? 0}
        plannedPaymentCents={statementDetail?.statement.plannedPaymentCents}
        status={statementDetail?.statement.status ?? "open"}
        charges={statementDetail?.charges ?? []}
        loading={isDetailPending}
        onClose={() => setDetailStatementId(null)}
        onEdit={() => {
          if (!detailStatementId) return;
          setDetailStatementId(null);
          openEditStatement(detailStatementId);
        }}
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
