## 2024-06-22 - Add ARIA label and title to Copy Code button
**Learning:** Found a missing accessibility feature and poor UX state for the icon-only "Copy Code" button in the Markdown viewer. Added `aria-label` and `title` via the translation string `common.copy` to provide better interaction guidance and screen reader support.
**Action:** Always ensure icon-only buttons have an `aria-label` and a `title` (using translated strings) for both accessibility and tooltips. Avoid global formatters and limit dependency installations when verifying changes to avoid out-of-scope lockfile noise.
