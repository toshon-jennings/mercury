## 2026-05-23 - Add ARIA labels to icon-only buttons
**Learning:** Many icon-only buttons in the Chat component lacked accessible labels, making them difficult for screen readers to interpret. Reusing the existing `title` translation string as the `aria-label` provides a seamless, localized accessibility improvement.
**Action:** Consistently review new and existing icon-only buttons to ensure they have an `aria-label`.
## 2026-05-23 - Improve Accessibility on Dynamic State Icon-Only Buttons
**Learning:** Found that dynamic UI states (like fast-mode toggle in `Chat.tsx` or conditionally-rendered clear search query in `Sessions.tsx`) often miss accessibility descriptions.
**Action:** When adding or modifying interactive buttons that rely purely on icons (even conditionally rendered ones), proactively implement `aria-label` and `title` utilizing `t()` function.
