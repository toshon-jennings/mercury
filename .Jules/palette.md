## 2026-05-23 - Add ARIA labels to icon-only buttons
**Learning:** Many icon-only buttons in the Chat component lacked accessible labels, making them difficult for screen readers to interpret. Reusing the existing `title` translation string as the `aria-label` provides a seamless, localized accessibility improvement.
**Action:** Consistently review new and existing icon-only buttons to ensure they have an `aria-label`.

## 2024-05-18 - Missing ARIA labels on contextual feature toggles
**Learning:** Icon-only toggle buttons that rely on custom styling (like `btn-ghost chat-fast-btn`) often miss standard screen-reader labels because they use popovers for visual context instead of semantic titles. The `chat-fast-wrapper` popover is visually helpful but invisible to screen readers without an explicit `aria-label` on the button itself.
**Action:** When auditing icon-only buttons, specifically check toggle features (e.g. Fast Mode, Folder pickers) that have custom UI popovers, as they frequently omit `aria-label` and `title` attributes despite providing visual tooltips.
