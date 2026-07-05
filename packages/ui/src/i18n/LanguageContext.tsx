import { createContext, useContext, type ReactNode } from "react";
import type { Language } from "@cashflow/core";
import { DEFAULT_SETTINGS, messagesFor, type Messages } from "@cashflow/core";

type LocaleState = {
  language: Language;
  dateFormat: string;
};

const LocaleContext = createContext<LocaleState>({
  language: DEFAULT_SETTINGS.language,
  dateFormat: DEFAULT_SETTINGS.dateFormat,
});

type ProviderProps = {
  language: Language;
  dateFormat?: string;
  children: ReactNode;
};

export function LanguageProvider({
  language,
  dateFormat = DEFAULT_SETTINGS.dateFormat,
  children,
}: ProviderProps) {
  return (
    <LocaleContext.Provider value={{ language, dateFormat }}>{children}</LocaleContext.Provider>
  );
}

export function useLanguage(): Language {
  return useContext(LocaleContext).language;
}

export function useDateFormat(): string {
  return useContext(LocaleContext).dateFormat;
}

export function useLocale(): LocaleState {
  return useContext(LocaleContext);
}

export function useMessages(): Messages {
  const language = useLanguage();
  return messagesFor(language);
}
