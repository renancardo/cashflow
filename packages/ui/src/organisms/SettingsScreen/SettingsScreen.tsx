import { useEffect, useRef, useState, type ChangeEvent } from "react";
import type { AccountType, Language } from "@cashflow/core";
import {
  ACCOUNT_TYPE_LABELS,
  ACCOUNT_TYPES,
  fmt,
  formatCents,
  formatMoney,
  messagesFor,
  parseMoney,
} from "@cashflow/core";
import { Button } from "../../atoms/Button/Button.js";
import { MoneyAmount } from "../../atoms/MoneyAmount/MoneyAmount.js";
import { Toggle } from "../../atoms/Toggle/Toggle.js";
import { Metric } from "../../molecules/Metric/Metric.js";
import {
  SegmentedControl,
  type SegmentedControlOption,
} from "../../molecules/SegmentedControl/SegmentedControl.js";
import { HeaderStrip } from "../HeaderStrip/HeaderStrip.js";
import { PageHeader } from "../PageHeader/PageHeader.js";
import styles from "./SettingsScreen.module.css";

export type SettingsDraft = {
  language: Language;
  dateFormat: string;
  negativeBufferCents: number;
  largeOutflowThresholdCents: number;
  horizonMonths: number;
  defaultWorkingForType: Partial<Record<AccountType, boolean>>;
};

export type SettingsBanner =
  | { kind: "success"; title: string; description: string }
  | { kind: "error"; title: string; description: string }
  | null;

const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as const;

const WORKING_DEFAULT_NOTES = {
  checking: "checkingNote",
  savings: "savingsNote",
  wallet: "walletNote",
  credit_card: "creditCardNote",
  investment: "investmentNote",
} as const satisfies Record<
  AccountType,
  "checkingNote" | "savingsNote" | "walletNote" | "creditCardNote" | "investmentNote"
>;

const ENTITY_TAG_KEYS = [
  "accounts",
  "transactions",
  "plannedItems",
  "installments",
  "categories",
  "budgets",
  "snapshots",
  "settings",
] as const;

type Props = {
  draft: SettingsDraft;
  workingBalanceCents: number;
  status?: "ready" | "loading" | "error";
  errorMessage?: string;
  banner?: SettingsBanner;
  isSaving?: boolean;
  isExporting?: boolean;
  importFileName?: string | null;
  onDraftChange: (patch: Partial<SettingsDraft>) => void;
  onLanguageChange: (language: Language) => void;
  onSave: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onDismissBanner?: () => void;
  onBackToCalendar?: () => void;
};

function moneyInputValue(cents: number): string {
  return formatCents(cents).replace(".", ",");
}

export function SettingsScreen({
  draft,
  workingBalanceCents,
  status = "ready",
  errorMessage,
  banner,
  isSaving = false,
  isExporting = false,
  importFileName,
  onDraftChange,
  onLanguageChange,
  onSave,
  onExport,
  onImport,
  onDismissBanner,
  onBackToCalendar,
}: Props) {
  const importRef = useRef<HTMLInputElement>(null);
  const [negativeBufferText, setNegativeBufferText] = useState(() =>
    moneyInputValue(draft.negativeBufferCents),
  );
  const [largeOutflowText, setLargeOutflowText] = useState(() =>
    moneyInputValue(draft.largeOutflowThresholdCents),
  );

  useEffect(() => {
    setNegativeBufferText(moneyInputValue(draft.negativeBufferCents));
    setLargeOutflowText(moneyInputValue(draft.largeOutflowThresholdCents));
  }, [draft.negativeBufferCents, draft.largeOutflowThresholdCents]);

  const m = messagesFor(draft.language);
  const languageOptions: SegmentedControlOption<Language>[] = [
    { value: "en", label: m.settings.locale.languageEn },
    { value: "pt-BR", label: m.settings.locale.languagePt },
  ];

  const handleNegativeBufferBlur = () => {
    const cents = parseMoney(negativeBufferText) ?? 0;
    setNegativeBufferText(moneyInputValue(cents));
    onDraftChange({ negativeBufferCents: cents });
  };

  const handleLargeOutflowBlur = () => {
    const cents = parseMoney(largeOutflowText) ?? 0;
    setLargeOutflowText(moneyInputValue(cents));
    onDraftChange({ largeOutflowThresholdCents: cents });
  };

  const handleImportClick = () => {
    if (importRef.current?.files?.length) {
      const file = importRef.current.files[0];
      if (file) onImport(file);
      return;
    }
    importRef.current?.click();
  };

  const handleImportChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) onImport(file);
  };

  if (status === "loading") {
    return (
      <div className={styles.status}>
        <h2 className={styles.statusTitle}>{m.settings.title}</h2>
        <p>{m.common.loadingEllipsis}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.status}>
        <h2 className={styles.statusTitle}>{m.settings.title}</h2>
        <p>{errorMessage ?? m.common.errorFallback}</p>
      </div>
    );
  }

  return (
    <>
      <HeaderStrip
        metric={
          <Metric label={m.calendar.workingBalance}>
            <MoneyAmount cents={workingBalanceCents} language={draft.language} />
          </Metric>
        }
        action={
          <Button variant="ghost" onClick={onExport} disabled={isExporting}>
            {isExporting ? m.settings.exporting : m.settings.downloadJson}
          </Button>
        }
      />

      <div className={styles.page}>
        <PageHeader title={m.settings.title} subtitle={m.settings.subtitle} />

        {banner && (
          <div
            className={[
              styles.banner,
              banner.kind === "error" ? styles.bannerError : styles.bannerSuccess,
            ].join(" ")}
            role={banner.kind === "error" ? "alert" : "status"}
          >
            <span className={styles.bannerIcon} aria-hidden>
              {banner.kind === "error" ? "⚠" : "✓"}
            </span>
            <div className={styles.bannerContent}>
              <p className={styles.bannerTitle}>{banner.title}</p>
              <p className={styles.bannerDesc}>{banner.description}</p>
            </div>
            <button
              type="button"
              className={styles.bannerDismiss}
              aria-label={m.settings.dismiss}
              onClick={onDismissBanner}
            >
              ×
            </button>
          </div>
        )}

        <div className={styles.layout}>
          <div className={styles.sections}>
            <section className={styles.section} aria-labelledby="locale-section-title">
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle} id="locale-section-title">
                  {m.settings.locale.title}
                </h2>
                <p className={styles.sectionDesc}>{m.settings.locale.desc}</p>
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="settings-language">
                    {m.settings.locale.language}
                  </label>
                  <div className={styles.fieldControl}>
                    <SegmentedControl
                      aria-label={m.settings.locale.language}
                      options={languageOptions}
                      value={draft.language}
                      onChange={onLanguageChange}
                    />
                    <p className={styles.fieldHint}>{m.settings.locale.languageHint}</p>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="settings-date-format">
                    {m.settings.locale.dateFormat}
                  </label>
                  <div className={styles.fieldControl}>
                    <select
                      id="settings-date-format"
                      className={styles.select}
                      value={draft.dateFormat}
                      onChange={(event) => onDraftChange({ dateFormat: event.target.value })}
                    >
                      {DATE_FORMATS.map((format) => (
                        <option key={format} value={format}>
                          {format}
                        </option>
                      ))}
                    </select>
                    <p className={styles.fieldHint}>{m.settings.locale.dateFormatHint}</p>
                  </div>
                </div>

                <div className={styles.field}>
                  <span className={styles.fieldLabel}>{m.settings.locale.currency}</span>
                  <div className={styles.fieldControl}>
                    <input
                      className={[styles.input, styles.inputReadonly].join(" ")}
                      type="text"
                      value={m.settings.locale.currencyValue}
                      readOnly
                      aria-readonly="true"
                    />
                    <p className={styles.fieldHint}>{m.settings.locale.currencyHint}</p>
                  </div>
                </div>
              </div>
            </section>

            <section className={styles.section} aria-labelledby="projection-section-title">
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle} id="projection-section-title">
                  {m.settings.projection.title}
                </h2>
                <p className={styles.sectionDesc}>{m.settings.projection.desc}</p>
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="settings-negative-buffer">
                    {m.settings.projection.negativeBuffer}
                  </label>
                  <div className={styles.fieldControl}>
                    <div className={styles.inputGroup}>
                      <span className={styles.inputPrefix}>R$</span>
                      <input
                        id="settings-negative-buffer"
                        className={[styles.input, styles.inputMoney].join(" ")}
                        type="text"
                        inputMode="decimal"
                        value={negativeBufferText}
                        onChange={(event) => setNegativeBufferText(event.target.value)}
                        onBlur={handleNegativeBufferBlur}
                      />
                    </div>
                    <p className={styles.fieldHint}>{m.settings.projection.negativeBufferHint}</p>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="settings-large-outflow">
                    {m.settings.projection.largeOutflow}
                  </label>
                  <div className={styles.fieldControl}>
                    <div className={styles.inputGroup}>
                      <span className={styles.inputPrefix}>R$</span>
                      <input
                        id="settings-large-outflow"
                        className={[styles.input, styles.inputMoney].join(" ")}
                        type="text"
                        inputMode="decimal"
                        value={largeOutflowText}
                        onChange={(event) => setLargeOutflowText(event.target.value)}
                        onBlur={handleLargeOutflowBlur}
                      />
                    </div>
                    <p className={styles.fieldHint}>{m.settings.projection.largeOutflowHint}</p>
                  </div>
                </div>

                <div className={styles.field}>
                  <label className={styles.fieldLabel} htmlFor="settings-horizon-months">
                    {m.settings.projection.horizon}
                  </label>
                  <div className={styles.fieldControl}>
                    <input
                      id="settings-horizon-months"
                      className={styles.input}
                      type="number"
                      min={1}
                      max={60}
                      value={draft.horizonMonths}
                      onChange={(event) =>
                        onDraftChange({
                          horizonMonths: Math.max(1, Math.min(60, Number(event.target.value) || 1)),
                        })
                      }
                    />
                    <p className={styles.fieldHint}>{m.settings.projection.horizonHint}</p>
                  </div>
                </div>

                <div
                  className={styles.indicatorLegend}
                  aria-label={m.common.aria.calendarIndicatorLegend}
                >
                  <span className={styles.indicatorLegendItem}>
                    <span className={[styles.indicatorLegendDot, styles.dotBuffer].join(" ")} />
                    {m.settings.projection.legendBelowBuffer}
                  </span>
                  <span className={styles.indicatorLegendItem}>
                    <span className={[styles.indicatorLegendDot, styles.dotOutflow].join(" ")} />
                    {m.settings.projection.legendLargeOutflow}
                  </span>
                  <span className={styles.indicatorLegendItem}>
                    <span className={[styles.indicatorLegendDot, styles.dotIncome].join(" ")} />
                    {m.settings.projection.legendIncome}
                  </span>
                </div>
              </div>
            </section>

            <section className={styles.section} aria-labelledby="defaults-section-title">
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle} id="defaults-section-title">
                  {m.settings.defaults.title}
                </h2>
                <p className={styles.sectionDesc}>{m.settings.defaults.desc}</p>
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.workingDefaults} role="list">
                  {ACCOUNT_TYPES.map((type) => {
                    const disabled = type === "credit_card";
                    const checked = draft.defaultWorkingForType[type] ?? false;
                    return (
                      <div
                        key={type}
                        className={[
                          styles.workingDefault,
                          disabled && styles.workingDefaultDisabled,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        role="listitem"
                      >
                        <div className={styles.workingDefaultInfo}>
                          <div className={styles.workingDefaultName}>
                            {ACCOUNT_TYPE_LABELS[type]}
                          </div>
                          <div className={styles.workingDefaultNote}>
                            {m.settings.defaults[WORKING_DEFAULT_NOTES[type]]}
                          </div>
                        </div>
                        <Toggle
                          checked={checked}
                          disabled={disabled}
                          aria-label={
                            disabled
                              ? m.settings.defaults.notApplicable
                              : checked
                                ? m.settings.defaults.workingOn
                                : m.settings.defaults.workingOff
                          }
                          onChange={(next) =>
                            onDraftChange({
                              defaultWorkingForType: {
                                ...draft.defaultWorkingForType,
                                [type]: next,
                              },
                            })
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className={styles.section} aria-labelledby="data-section-title">
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle} id="data-section-title">
                  {m.settings.data.title}
                </h2>
                <p className={styles.sectionDesc}>{m.settings.data.desc}</p>
              </div>
              <div className={styles.sectionBody}>
                <div className={styles.dataActions}>
                  <div className={styles.dataAction}>
                    <div className={styles.dataActionInfo}>
                      <h3 className={styles.dataActionTitle}>{m.settings.data.exportTitle}</h3>
                      <p className={styles.dataActionDesc}>{m.settings.data.exportDesc}</p>
                      <div
                        className={styles.dataActionEntities}
                        aria-label={m.common.aria.includedEntities}
                      >
                        {ENTITY_TAG_KEYS.map((key) => (
                          <span key={key} className={styles.dataActionEntity}>
                            {m.settings.data.entity[key]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={styles.dataActionControls}>
                      <Button variant="primary" onClick={onExport} disabled={isExporting}>
                        {isExporting ? m.settings.exporting : m.settings.downloadJson}
                      </Button>
                    </div>
                  </div>

                  <div className={styles.dataAction}>
                    <div className={styles.dataActionInfo}>
                      <h3 className={styles.dataActionTitle}>{m.settings.data.restoreTitle}</h3>
                      <p className={styles.dataActionDesc}>{m.settings.data.restoreDesc}</p>
                    </div>
                    <div className={styles.dataActionControls}>
                      <div className={styles.importZone}>
                        <input
                          ref={importRef}
                          className={styles.importInput}
                          type="file"
                          accept=".json,application/json"
                          onChange={handleImportChange}
                        />
                        <Button variant="ghost" onClick={handleImportClick}>
                          {importFileName
                            ? fmt(m.settings.data.restoreFrom, { fileName: importFileName })
                            : m.settings.data.chooseRestore}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className={styles.sidebar} aria-label={m.common.aria.settingsSummary}>
            <div className={styles.sidebarCard}>
              <h2 className={styles.sidebarTitle}>{m.settings.sidebar.currentValues}</h2>
              <dl className={styles.sidebarList}>
                <div className={styles.sidebarRow}>
                  <dt className={styles.sidebarLabel}>{m.settings.sidebar.language}</dt>
                  <dd className={styles.sidebarValue}>
                    {draft.language === "en"
                      ? m.settings.locale.languageEn
                      : m.settings.locale.languagePt}
                  </dd>
                </div>
                <div className={styles.sidebarRow}>
                  <dt className={styles.sidebarLabel}>{m.settings.sidebar.buffer}</dt>
                  <dd className={styles.sidebarValue}>
                    {formatMoney(draft.negativeBufferCents, draft.language)}
                  </dd>
                </div>
                <div className={styles.sidebarRow}>
                  <dt className={styles.sidebarLabel}>{m.settings.sidebar.largeOutflow}</dt>
                  <dd className={styles.sidebarValue}>
                    {formatMoney(draft.largeOutflowThresholdCents, draft.language)}
                  </dd>
                </div>
                <div className={styles.sidebarRow}>
                  <dt className={styles.sidebarLabel}>{m.settings.sidebar.horizon}</dt>
                  <dd className={styles.sidebarValue}>
                    {fmt(m.settings.sidebar.horizonMonths, {
                      count: draft.horizonMonths,
                    })}
                  </dd>
                </div>
                <div className={styles.sidebarRow}>
                  <dt className={styles.sidebarLabel}>{m.settings.sidebar.dateFormat}</dt>
                  <dd className={styles.sidebarValue}>{draft.dateFormat}</dd>
                </div>
              </dl>
            </div>

            <div className={styles.sidebarCard}>
              <h2 className={styles.sidebarTitle}>{m.settings.sidebar.actions}</h2>
              <div className={styles.sidebarActions}>
                <Button variant="primary" onClick={onSave} disabled={isSaving}>
                  {m.settings.saveChanges}
                </Button>
                {onBackToCalendar && (
                  <Button variant="ghost" onClick={onBackToCalendar}>
                    {m.settings.backToCalendar}
                  </Button>
                )}
              </div>
              <p className={styles.sidebarNote}>{m.settings.sidebar.note}</p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
