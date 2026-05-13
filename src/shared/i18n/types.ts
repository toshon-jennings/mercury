export type AppLocale = "en" | "es" | "id" | "pt-BR" | "zh-CN";

export type TranslationTree = {
  [key: string]: string | TranslationTree;
};
