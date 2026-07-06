import type { Language } from "../entities.js";
import { en } from "./locales/en.js";
import { ptBR } from "./locales/pt-BR.js";
import type { DeepStringRecord } from "./types.js";
import type { MessageTree } from "./locales/en.js";

export type { MessageTree };
export type Messages = DeepStringRecord<MessageTree>;

const locales: Record<Language, Messages> = {
  en,
  "pt-BR": ptBR,
};

export function messagesFor(language: Language): Messages {
  return locales[language] ?? locales.en;
}

export function fmt(template: string, params: Record<string, string | number>): string {
  let text = template;
  for (const [name, value] of Object.entries(params)) {
    text = text.replace(`{${name}}`, String(value));
  }
  return text;
}
