## 2026-05-23 - Add ARIA labels to icon-only buttons
**Learning:** Many icon-only buttons in the Chat component lacked accessible labels, making them difficult for screen readers to interpret. Reusing the existing `title` translation string as the `aria-label` provides a seamless, localized accessibility improvement.
**Action:** Consistently review new and existing icon-only buttons to ensure they have an `aria-label`.

## 2026-06-01 - Icon-Only Button Accessibility Pattern Across the App
**Learning:** An app-wide pattern emerged where interactive `btn-ghost` components containing only icons were systematically lacking `aria-label` attributes. While hover `title` tags were sometimes present (which helps sighted mouse users), screen reader users were left with unannounced generic button roles.
**Action:** Always check `btn-ghost` usages and `<X size={...} />` clear/close buttons. Ensure `aria-label` is populated using the `t()` translation strings for internationalized screen reader support.
