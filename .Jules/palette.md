## 2026-05-23 - Add ARIA labels to icon-only buttons
**Learning:** Many icon-only buttons in the Chat component lacked accessible labels, making them difficult for screen readers to interpret. Reusing the existing `title` translation string as the `aria-label` provides a seamless, localized accessibility improvement.
**Action:** Consistently review new and existing icon-only buttons to ensure they have an `aria-label`.
## 2024-05-30 - Added ARIA label to copy code button
 **Learning:** In `AgentMarkdown.tsx`, the `Copy` button was missing `aria-label` and `title` attributes making it difficult for screen readers to recognize it.
 **Action:** Added `aria-label={copied ? t("common.copied") : t("common.copy")}` and `title={copied ? t("common.copied") : t("common.copy")}` using the `react-i18next` localized texts to fix this.
