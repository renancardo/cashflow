import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import type { Account } from "@cashflow/core";
import { defaultIsWorking } from "@cashflow/core";
import {
  AccountEditorPanel,
  AccountsScreen,
  StatementDetailPanel,
  StatementEditorPanel,
  StatementListPanel,
  type AccountEditorValues,
  type StatementChargeRow,
  type StatementEditorValues,
} from "@cashflow/ui";
import {
  createEmptyAccountInput,
  useAccountMutations,
  type AccountInput,
} from "../data/mutations/useAccountMutations";
import { useInstallmentMutations } from "../data/mutations/useInstallmentMutations";
import { usePlannedItemMutations } from "../data/mutations/usePlannedItemMutations";
import { usePlannedItemOverrideMutations } from "../data/mutations/usePlannedItemOverrideMutations";
import { useStatementMutations } from "../data/mutations/useStatementMutations";
import { useTransactionMutations } from "../data/mutations/useTransactionMutations";
import { useSettings } from "../data/queries/useSettings";
import { useAccounts } from "../data/queries/useAccounts";
import { useStatements } from "../data/queries/useStatements";
import { useStatementDetail } from "../data/queries/useStatementDetail";
import { useAppClock } from "../dev/useAppClock";

function toEditorValues(account: Account): AccountEditorValues {
  return {
    name: account.name,
    type: account.type,
    currency: account.currency,
    isWorking: account.isWorking,
    anchorBalanceCents: account.anchorBalanceCents,
    anchorDate: account.anchorDate,
    closingDay: account.closingDay,
    dueDay: account.dueDay,
    creditLimitCents: account.creditLimitCents,
    defaultPayFromAccountId: account.defaultPayFromAccountId,
    institution: account.institution,
    notes: account.notes,
  };
}

function toAccountInput(values: AccountEditorValues): AccountInput {
  return {
    name: values.name,
    type: values.type,
    currency: values.currency,
    isWorking: values.isWorking,
    anchorBalanceCents: values.anchorBalanceCents,
    anchorDate: values.anchorDate,
    closingDay: values.closingDay,
    dueDay: values.dueDay,
    creditLimitCents: values.creditLimitCents,
    defaultPayFromAccountId: values.defaultPayFromAccountId,
    institution: values.institution,
    notes: values.notes,
  };
}

type EditorSearch = {
  new?: true;
  edit?: string;
};

type Props = {
  editorSearch?: EditorSearch;
  onEditorSearchChange?: (search: EditorSearch) => void;
};

export function AccountsPage({ editorSearch = {}, onEditorSearchChange }: Props) {
  const navigate = useNavigate();
  const { today } = useAppClock();
  const { data, isPending, isError, error } = useAccounts();
  const { data: settingsData } = useSettings();
  const [statementsCardId, setStatementsCardId] = useState<string | null>(null);
  const [detailStatementId, setDetailStatementId] = useState<string | null>(null);
  const [editingStatementId, setEditingStatementId] = useState<string | null>(null);
  const [statementValues, setStatementValues] = useState<StatementEditorValues>({});

  const { data: statements = [] } = useStatements(statementsCardId);
  const { data: statementDetail, isPending: isDetailPending } =
    useStatementDetail(detailStatementId);
  const { create, update, archive, setWorking } = useAccountMutations();
  const statementMutations = useStatementMutations();
  const transactionMutations = useTransactionMutations();
  const plannedMutations = usePlannedItemMutations();
  const plannedOverrideMutations = usePlannedItemOverrideMutations();
  const installmentMutations = useInstallmentMutations();

  const editorOpen = Boolean(editorSearch.new || editorSearch.edit);
  const editorMode = editorSearch.edit ? "edit" : "create";
  const editingId = editorSearch.edit ?? null;
  const [editorValues, setEditorValues] = useState<AccountEditorValues>(() =>
    createEmptyAccountInput(today, "BRL", settingsData),
  );

  const payFromOptions = useMemo(
    () =>
      (data?.rawAccounts ?? [])
        .filter((account) => account.isWorking && !account.archivedAt)
        .map((account) => ({ id: account.id, name: account.name })),
    [data?.rawAccounts],
  );

  const editingBalanceCents = useMemo(() => {
    if (!editingId || !data) return undefined;
    return data.accounts.find((row) => row.id === editingId)?.balanceCents;
  }, [data, editingId]);

  const statementsCardName = useMemo(() => {
    return data?.rawAccounts.find((account) => account.id === statementsCardId)?.name ?? "";
  }, [data?.rawAccounts, statementsCardId]);

  const editingStatement = useMemo(
    () => statements.find((row) => row.id === editingStatementId),
    [statements, editingStatementId],
  );

  useEffect(() => {
    if (editorSearch.edit) {
      const account = data?.rawAccounts.find((row) => row.id === editorSearch.edit);
      if (account) setEditorValues(toEditorValues(account));
      return;
    }

    if (editorSearch.new) {
      setEditorValues(createEmptyAccountInput(today, "BRL", settingsData));
    }
  }, [editorSearch.edit, editorSearch.new, data?.rawAccounts, settingsData, today]);

  useEffect(() => {
    if (!editingStatement) return;
    const remainingCents = Math.max(
      0,
      editingStatement.computedTotalCents - (editingStatement.paidAmountCents ?? 0),
    );
    setStatementValues({
      plannedPaymentCents:
        editingStatement.status === "partially_paid"
          ? remainingCents
          : editingStatement.plannedPaymentCents,
      payFromAccountId: editingStatement.payFromAccountId,
    });
  }, [editingStatement]);

  const openCreate = () => {
    setEditorValues(createEmptyAccountInput(today, "BRL", settingsData));
    onEditorSearchChange?.({ new: true });
  };

  const openEdit = (id: string) => {
    const account = data?.rawAccounts.find((row) => row.id === id);
    if (!account) return;
    setEditorValues(toEditorValues(account));
    onEditorSearchChange?.({ edit: id });
  };

  const closeEditor = () => {
    onEditorSearchChange?.({});
  };

  const handleSave = async () => {
    const input = toAccountInput(editorValues);
    if (!input.name.trim()) return;

    if (editorMode === "create") {
      await create.mutateAsync(input);
    } else if (editingId) {
      await update.mutateAsync({ id: editingId, input });
    }

    closeEditor();
  };

  const handleArchive = async () => {
    if (!editingId) return;
    await archive.mutateAsync(editingId);
    closeEditor();
  };

  const handleTypeChange = (patch: Partial<AccountEditorValues>) => {
    setEditorValues((current) => {
      const next = { ...current, ...patch };
      if (patch.type && patch.type !== current.type) {
        next.isWorking = defaultIsWorking(patch.type, settingsData);
      }
      return next;
    });
  };

  const openStatementEditor = (statementId: string) => {
    setDetailStatementId(null);
    setEditingStatementId(statementId);
  };

  const handleStatementSave = async () => {
    if (!editingStatementId) return;
    await statementMutations.update.mutateAsync({
      id: editingStatementId,
      input: statementValues,
    });
    setEditingStatementId(null);
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
    setEditingStatementId(null);
  };

  const handleEditCharge = (charge: StatementChargeRow) => {
    setDetailStatementId(null);
    setStatementsCardId(null);
    if (charge.source === "transaction" || charge.source === "payment") {
      navigate({ to: "/transactions", search: { edit: charge.refId } });
      return;
    }
    if (charge.source === "planned") {
      navigate({ to: "/forecast", search: { planned: charge.refId } });
      return;
    }
    if (charge.source === "installment" && charge.planId) {
      navigate({ to: "/forecast", search: { installment: charge.planId } });
    }
  };

  const handleDeleteCharge = async (charge: StatementChargeRow) => {
    if (!window.confirm("Remove this charge from the statement?")) return;

    if (charge.source === "transaction" || charge.source === "payment") {
      await transactionMutations.remove.mutateAsync(charge.refId);
      return;
    }
    if (charge.source === "planned") {
      await plannedOverrideMutations.skipOccurrence.mutateAsync({
        plannedItemId: charge.refId,
        occurrenceDate: charge.effectiveDate,
      });
      return;
    }
    if (charge.source === "installment") {
      await installmentMutations.removeCharge.mutateAsync(charge.refId);
    }
  };

  const handleMarkChargePaid = async (charge: StatementChargeRow) => {
    if (charge.source === "planned") {
      await plannedMutations.markPaid.mutateAsync({
        plannedItemId: charge.refId,
        occurrenceDate: charge.effectiveDate,
        effectiveDate: charge.effectiveDate,
      });
      return;
    }
    if (charge.source === "installment") {
      await installmentMutations.markPaid.mutateAsync({
        installmentId: charge.refId,
        effectiveDate: charge.effectiveDate,
      });
    }
  };

  return (
    <AccountsScreen
      accounts={data?.accounts ?? []}
      workingBalanceCents={data?.workingBalanceCents ?? 0}
      status={isPending ? "loading" : isError ? "error" : "ready"}
      errorMessage={error instanceof Error ? error.message : undefined}
      onAddAccount={openCreate}
      onEdit={openEdit}
      onStatements={setStatementsCardId}
      onWorkingChange={(id, isWorking) => setWorking.mutate({ id, isWorking })}
      editor={
        <>
          <AccountEditorPanel
            open={editorOpen}
            mode={editorMode}
            values={editorValues}
            balanceCents={editingBalanceCents}
            payFromOptions={payFromOptions}
            onChange={handleTypeChange}
            onClose={closeEditor}
            onSave={handleSave}
            onArchive={editorMode === "edit" ? handleArchive : undefined}
          />
          <StatementListPanel
            open={Boolean(statementsCardId)}
            cardName={statementsCardName}
            statements={statements}
            onClose={() => setStatementsCardId(null)}
            onViewItems={(statementId) => setDetailStatementId(statementId)}
            onEdit={openStatementEditor}
            onNavigateToTransaction={(transactionId) => {
              setStatementsCardId(null);
              setDetailStatementId(null);
              navigate({ to: "/transactions", search: { edit: transactionId } });
            }}
          />
          <StatementDetailPanel
            open={Boolean(detailStatementId)}
            cardName={statementDetail?.cardName ?? statementsCardName}
            periodStart={statementDetail?.statement.periodStart ?? ""}
            closingDate={statementDetail?.statement.closingDate ?? ""}
            dueDate={statementDetail?.statement.dueDate ?? ""}
            computedTotalCents={statementDetail?.statement.computedTotalCents ?? 0}
            plannedPaymentCents={statementDetail?.statement.plannedPaymentCents}
            paidAmountCents={statementDetail?.statement.paidAmountCents}
            status={statementDetail?.statement.status ?? "open"}
            charges={statementDetail?.charges ?? []}
            loading={isDetailPending}
            onClose={() => setDetailStatementId(null)}
            onEdit={() => {
              if (!detailStatementId) return;
              openStatementEditor(detailStatementId);
            }}
            onEditCharge={handleEditCharge}
            onDeleteCharge={handleDeleteCharge}
            onMarkChargePaid={handleMarkChargePaid}
          />
          <StatementEditorPanel
            open={Boolean(editingStatementId && editingStatement)}
            cardName={statementsCardName || "Credit card"}
            periodStart={editingStatement?.periodStart ?? ""}
            closingDate={editingStatement?.closingDate ?? ""}
            dueDate={editingStatement?.dueDate ?? ""}
            computedTotalCents={editingStatement?.computedTotalCents ?? 0}
            paidAmountCents={editingStatement?.paidAmountCents}
            values={statementValues}
            status={editingStatement?.status ?? "open"}
            payFromOptions={payFromOptions}
            saving={
              statementMutations.update.isPending ||
              statementMutations.recordPayment.isPending ||
              statementMutations.resetOverride.isPending
            }
            onChange={(patch) => setStatementValues((current) => ({ ...current, ...patch }))}
            onClose={() => setEditingStatementId(null)}
            onResetToFull={handleStatementReset}
            onSave={handleStatementSave}
            onRecordPayment={handleStatementRecordPayment}
          />
        </>
      }
    />
  );
}
