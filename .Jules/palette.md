## 2025-05-22 - Add ARIA Labels to Icon-only Buttons

**Learning:** Found multiple instances of icon-only buttons (Trash, Refresh, X, Stop) without `aria-label` attributes. This negatively impacts screen reader users as they receive no context on what the button does.
**Action:** Implementing `aria-label` attributes for these elements and establishing it as a pattern using the `t()` translation hook for accessibility.
