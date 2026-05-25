## 2024-05-25 - ARIA labels for icon-only buttons
**Learning:** Found multiple instances of icon-only copy buttons lacking proper screen reader support. It's a recurrent pattern to use tooltips (via `title` attribute or otherwise) but neglect `aria-label`.
**Action:** Always verify that icon-only buttons (like those containing `<Copy size={14} />`) explicitly define an `aria-label` attribute, mapping it to existing translation keys (e.g., `t("common.copy")` or `t("welcome.copyInstallCommand")`).
