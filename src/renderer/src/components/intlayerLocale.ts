import type { AppLocale } from "../../../shared/i18n";

type IntlayerLocale = AppLocale;

export function toIntlayerLocale(locale: AppLocale): IntlayerLocale {
  switch (locale) {
    case "en":
      return "en";
    case "es":
      return "es";
    case "id":
      return "id";
    case "pt-BR":
      return "pt-BR";
    case "zh-CN":
      return "zh-CN";
    default: {
      const unreachable: never = locale;
      throw new Error(`Unsupported app locale: ${unreachable}`);
    }
  }
}

export function fromIntlayerLocale(locale: string): AppLocale {
  switch (locale) {
    case "en":
      return "en";
    case "es":
      return "es";
    case "id":
      return "id";
    case "pt-BR":
      return "pt-BR";
    case "zh-CN":
      return "zh-CN";
    default:
      throw new Error(`Unsupported Intlayer locale: ${locale}`);
  }
}
