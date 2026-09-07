import React from "react";

const IntlayerContext = React.createContext<{
  locale: string;
  setLocale: (locale: string) => void;
}>({
  locale: "en",
  setLocale: () => undefined,
});

const dictionaries = {
  soul: {
    en: {
      title: "Persona",
      subtitle:
        "Define your agent's personality, tone, and instructions via SOUL.md",
      resetTitle: "Reset to default",
      reset: "Reset",
      resetConfirm:
        "Reset to the default persona? Your current content will be lost.",
      placeholder: "Write your agent's persona instructions here...",
      hint: "This file is loaded fresh for every conversation. Use it to define your agent's personality, communication style, and any standing instructions.",
      saved: "Saved",
      cancel: "Cancel",
    },
    es: {
      title: "Persona",
      subtitle:
        "Define la personalidad, el tono y las instrucciones de tu agente mediante SOUL.md",
      resetTitle: "Restablecer a la configuración predeterminada",
      reset: "Restablecer",
      resetConfirm:
        "¿Restablecer la personalidad predeterminada? Se perderá tu contenido actual.",
      placeholder:
        "Escribe aquí las instrucciones de personalidad de tu agente...",
      hint: "Este archivo se carga de nuevo en cada conversación. Úsalo para definir la personalidad de tu agente, su estilo de comunicación y cualquier instrucción permanente.",
      saved: "Guardado",
      cancel: "Cancelar",
    },
    id: {
      title: "Persona",
      subtitle:
        "Tentukan kepribadian, nada, dan instruksi agent Anda melalui SOUL.md",
      resetTitle: "Reset ke default",
      reset: "Reset",
      resetConfirm:
        "Reset ke persona default? Konten Anda saat ini akan hilang.",
      placeholder: "Tulis instruksi persona agent Anda di sini...",
      hint: "File ini dimuat ulang untuk setiap percakapan. Gunakan untuk menentukan kepribadian agent, gaya komunikasi, dan instruksi tetap.",
      saved: "Disimpan",
      cancel: "Batal",
    },
    "pt-BR": {
      title: "Persona",
      subtitle:
        "Defina a personalidade, o tom e as instruções do seu agente via SOUL.md",
      resetTitle: "Redefinir para o padrão",
      reset: "Redefinir",
      resetConfirm:
        "Redefinir para a persona padrão? Seu conteúdo atual será perdido.",
      placeholder: "Escreva as instruções da persona do seu agente aqui...",
      hint: "Este arquivo é carregado novamente a cada conversa. Use-o para definir a personalidade do seu agente, o estilo de comunicação e quaisquer instruções permanentes.",
      saved: "Salvo",
      cancel: "Cancelar",
    },
    "zh-CN": {
      title: "人格",
      subtitle: "通过 SOUL.md 定义代理的人格、语气和长期指令",
      resetTitle: "恢复默认",
      reset: "重置",
      resetConfirm: "要恢复为默认人格吗？当前内容会丢失。",
      placeholder: "在这里编写你的代理人格指令...",
      hint: "每次对话都会重新加载这个文件。你可以在这里定义代理的人格、表达风格以及长期生效的指令。",
      saved: "已保存",
      cancel: "取消",
    },
  },
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
