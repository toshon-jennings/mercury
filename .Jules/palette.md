## 2026-05-23 - Add ARIA labels to icon-only buttons
**Learning:** Many icon-only buttons in the Chat component lacked accessible labels, making them difficult for screen readers to interpret. Reusing the existing `title` translation string as the `aria-label` provides a seamless, localized accessibility improvement.
**Action:** Consistently review new and existing icon-only buttons to ensure they have an `aria-label`.
## 2026-06-16 - Found Missing ARIA labels and titles on Memory screen
**Learning:** Found multiple icon-only buttons on the Memory screen missing screen-reader accessible names and tooltips.
**Action:** Always verify icon-only buttons have `aria-label` and `title` attributes populated via translations, specifically on the refresh, delete, and external link interactions.
