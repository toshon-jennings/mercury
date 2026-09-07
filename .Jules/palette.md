## 2026-05-23 - Add ARIA labels to icon-only buttons
**Learning:** Many icon-only buttons in the Chat component lacked accessible labels, making them difficult for screen readers to interpret. Reusing the existing `title` translation string as the `aria-label` provides a seamless, localized accessibility improvement.
**Action:** Consistently review new and existing icon-only buttons to ensure they have an `aria-label`.

## 2026-06-01 - Icon-Only Button Accessibility Pattern Across the App
**Learning:** An app-wide pattern emerged where interactive `btn-ghost` components containing only icons were systematically lacking `aria-label` attributes. While hover `title` tags were sometimes present (which helps sighted mouse users), screen reader users were left with unannounced generic button roles.
**Action:** Always check `btn-ghost` usages and `<X size={...} />` clear/close buttons. Ensure `aria-label` is populated using the `t()` translation strings for internationalized screen reader support.

## 2025-05-22 - Add ARIA Labels to Icon-only Buttons

**Learning:** Found multiple instances of icon-only buttons (Trash, Refresh, X, Stop) without `aria-label` attributes. This negatively impacts screen reader users as they receive no context on what the button does.
**Action:** Implementing `aria-label` attributes for these elements and establishing it as a pattern using the `t()` translation hook for accessibility.

## 2026-07-14 - Redundant Aria-labels
**Learning:** When adding `aria-label` to buttons, ensure they don't already have visible text. Adding `aria-label` to buttons with visible text is redundant and can cause screen readers to read the same thing twice.
**Action:** Check if the button has text content before adding `aria-label`.

## 2026-05-23 - Improve Accessibility on Dynamic State Icon-Only Buttons
**Learning:** Found that dynamic UI states (like fast-mode toggle in `Chat.tsx` or conditionally-rendered clear search query in `Sessions.tsx`) often miss accessibility descriptions.
**Action:** When adding or modifying interactive buttons that rely purely on icons (even conditionally rendered ones), proactively implement `aria-label` and `title` utilizing `t()` function.
