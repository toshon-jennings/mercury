## 2026-05-23 - Add ARIA labels to icon-only buttons
**Learning:** Many icon-only buttons in the Chat component lacked accessible labels, making them difficult for screen readers to interpret. Reusing the existing `title` translation string as the `aria-label` provides a seamless, localized accessibility improvement.
**Action:** Consistently review new and existing icon-only buttons to ensure they have an `aria-label`.
## 2023-10-27 - Icon-only Close Buttons Missing A11y Attributes
**Learning:** Icon-only close buttons (e.g. `<X size={18} />`) throughout the `Schedules.tsx` modals were missing `aria-label` and `title` attributes, making them inaccessible to screen readers and lacking helpful tooltips on hover.
**Action:** When adding icon-only buttons, always ensure they have `title` and `aria-label` attributes using the appropriate translation keys (e.g., `t("common.close")`).
