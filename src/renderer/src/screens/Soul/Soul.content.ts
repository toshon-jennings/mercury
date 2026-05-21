import { t, type Dictionary } from "intlayer";

const soulContent = {
  key: "soul",
  content: {
    title: t({
      en: "Persona",
      es: "Persona",
      id: "Persona",
      "pt-BR": "Persona",
      "zh-CN": "人格",
    }),
    subtitle: t({
      en: "Define your agent's personality, tone, and instructions via SOUL.md",
      es: "Define la personalidad, el tono y las instrucciones de tu agente mediante SOUL.md",
      id: "Tentukan kepribadian, nada, dan instruksi agent Anda melalui SOUL.md",
      "pt-BR":
        "Defina a personalidade, o tom e as instruções do seu agente via SOUL.md",
      "zh-CN": "通过 SOUL.md 定义代理的人格、语气和长期指令",
    }),
    resetTitle: t({
      en: "Reset to default",
      es: "Restablecer a la configuración predeterminada",
      id: "Reset ke default",
      "pt-BR": "Redefinir para o padrão",
      "zh-CN": "恢复默认",
    }),
    reset: t({
      en: "Reset",
      es: "Restablecer",
      id: "Reset",
      "pt-BR": "Redefinir",
      "zh-CN": "重置",
    }),
    resetConfirm: t({
      en: "Reset to the default persona? Your current content will be lost.",
      es: "¿Restablecer la personalidad predeterminada? Se perderá tu contenido actual.",
      id: "Reset ke persona default? Konten Anda saat ini akan hilang.",
      "pt-BR":
        "Redefinir para a persona padrão? Seu conteúdo atual será perdido.",
      "zh-CN": "要恢复为默认人格吗？当前内容会丢失。",
    }),
    placeholder: t({
      en: "Write your agent's persona instructions here...",
      es: "Escribe aquí las instrucciones de personalidad de tu agente...",
      id: "Tulis instruksi persona agent Anda di sini...",
      "pt-BR": "Escreva as instruções da persona do seu agente aqui...",
      "zh-CN": "在这里编写你的代理人格指令...",
    }),
    hint: t({
      en: "This file is loaded fresh for every conversation. Use it to define your agent's personality, communication style, and any standing instructions.",
      es: "Este archivo se carga de nuevo en cada conversación. Úsalo para definir la personalidad de tu agente, su estilo de comunicación y cualquier instrucción permanente.",
      id: "File ini dimuat ulang untuk setiap percakapan. Gunakan untuk menentukan kepribadian agent, gaya komunikasi, dan instruksi tetap.",
      "pt-BR":
        "Este arquivo é carregado novamente a cada conversa. Use-o para definir a personalidade do seu agente, o estilo de comunicação e quaisquer instruções permanentes.",
      "zh-CN":
        "每次对话都会重新加载这个文件。你可以在这里定义代理的人格、表达风格以及长期生效的指令。",
    }),
    saved: t({
      en: "Saved",
      es: "Guardado",
      id: "Disimpan",
      "pt-BR": "Salvo",
      "zh-CN": "已保存",
    }),
    cancel: t({
      en: "Cancel",
      es: "Cancelar",
      id: "Batal",
      "pt-BR": "Cancelar",
      "zh-CN": "取消",
    }),
  },
} satisfies Dictionary;

export default soulContent;
