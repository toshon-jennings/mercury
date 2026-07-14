## 2026-05-23 - Add ARIA labels to icon-only buttons
**Learning:** Many icon-only buttons in the Chat component lacked accessible labels, making them difficult for screen readers to interpret. Reusing the existing `title` translation string as the `aria-label` provides a seamless, localized accessibility improvement.
**Action:** Consistently review new and existing icon-only buttons to ensure they have an `aria-label`.

## 2026-07-14 - Redundant Aria-labels
**Learning:** When adding `aria-label` to buttons, ensure they don't already have visible text. Adding `aria-label` to buttons with visible text is redundant and can cause screen readers to read the same thing twice.
**Action:** Check if the button has text content before adding `aria-label`.
