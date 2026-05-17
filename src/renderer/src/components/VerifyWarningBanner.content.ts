import { t, type Dictionary } from "intlayer";

const verifyWarningBannerContent = {
  key: "verify-warning-banner",
  content: {
    message: t({
      en: "Mercury is installed, but a health check didn't complete. The app should still work — reinstall if you run into issues.",
      es: "Mercury está instalado, pero no se completó una comprobación. La aplicación debería funcionar — reinstala si hay problemas.",
      id: "Mercury terinstal, tetapi pemeriksaan kesehatan tidak selesai. Aplikasi seharusnya tetap berfungsi — instal ulang jika ada masalah.",
      "pt-BR":
        "O Mercury está instalado, mas uma verificação não foi concluída. O app ainda deve funcionar — reinstale se tiver problemas.",
      "zh-CN":
        "Mercury 已安装，但健康检查未完成。应用仍可使用——如遇问题请尝试重新安装。",
    }),
    reinstall: t({
      en: "Reinstall",
      es: "Reinstalar",
      id: "Instal ulang",
      "pt-BR": "Reinstalar",
      "zh-CN": "重新安装",
    }),
    dismiss: t({
      en: "Dismiss",
      es: "Descartar",
      id: "Tutup",
      "pt-BR": "Dispensar",
      "zh-CN": "忽略",
    }),
  },
} satisfies Dictionary;

export default verifyWarningBannerContent;
