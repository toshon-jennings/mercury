import React from "react";

const IntlayerContext = React.createContext<{
  locale: string;
  setLocale: (locale: string) => void;
}>({
  locale: "en",
  setLocale: () => undefined,
});

const dictionaries = {
  "verify-warning-banner": {
    en: {
      message:
        "Mercury is installed, but a health check didn't complete. The app should still work — reinstall if you run into issues.",
      reinstall: "Reinstall",
      dismiss: "Dismiss",
    },
    es: {
      message:
        "Mercury está instalado, pero no se completó una comprobación. La aplicación debería funcionar — reinstala si hay problemas.",
      reinstall: "Reinstalar",
      dismiss: "Descartar",
    },
    id: {
      message:
        "Mercury terinstal, tetapi pemeriksaan kesehatan tidak selesai. Aplikasi seharusnya tetap berfungsi — instal ulang jika ada masalah.",
      reinstall: "Instal ulang",
      dismiss: "Tutup",
    },
    "pt-BR": {
      message:
        "O Mercury está instalado, mas uma verificação não foi concluída. O app ainda deve funcionar — reinstale se tiver problemas.",
      reinstall: "Reinstalar",
      dismiss: "Dispensar",
    },
    "zh-CN": {
      message:
        "Mercury 已安装，但健康检查未完成。应用仍可使用——如遇问题请尝试重新安装。",
      reinstall: "重新安装",
      dismiss: "忽略",
    },
  },
} as const;

export function IntlayerProviderContent({
  children,
  locale = "en",
  setLocale = () => undefined,
}: {
  children: React.ReactNode;
  locale?: string;
  setLocale?: (locale: string) => void;
}): React.JSX.Element {
  return React.createElement(
    IntlayerContext.Provider,
    { value: { locale, setLocale } },
    children,
  );
}

export function useIntlayer(
  key: keyof typeof dictionaries,
): (typeof dictionaries)[typeof key][keyof (typeof dictionaries)[typeof key]] {
  const { locale } = React.useContext(IntlayerContext);
  const dictionary = dictionaries[key];
  return dictionary[locale as keyof typeof dictionary] ?? dictionary.en;
}
