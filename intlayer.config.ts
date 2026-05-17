import { Locales, type IntlayerConfig } from "intlayer";

const config = {
  internationalization: {
    locales: [
      Locales.ENGLISH,
      Locales.SPANISH,
      Locales.INDONESIAN,
      Locales.PORTUGUESE_BRAZIL,
      Locales.CHINESE_SIMPLIFIED_CHINA,
    ],
    defaultLocale: Locales.ENGLISH,
  },
  content: {
    contentDir: ["src/renderer/src"],
    codeDir: ["src/renderer/src"],
  },
} satisfies IntlayerConfig;

export default config;
