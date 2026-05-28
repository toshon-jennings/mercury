## 2026-05-23 - Add ARIA labels to icon-only buttons
**Learning:** Many icon-only buttons in the Chat component lacked accessible labels, making them difficult for screen readers to interpret. Reusing the existing `title` translation string as the `aria-label` provides a seamless, localized accessibility improvement.
**Action:** Consistently review new and existing icon-only buttons to ensure they have an `aria-label`.
## 2026-05-28 - Add ARIA label to Chat Fast Mode Toggle button
**Learning:** Found an icon-only button (Zap icon for fast mode) in Chat.tsx that lacked `aria-label` and `title` attributes. Adding these attributes significantly improves screen reader accessibility and provides a native tooltip on hover. Using existing translation keys ensures localization is maintained.
**Action:** When inspecting complex UI elements with custom popovers (like the `chat-fast-popover`), remember to also verify the accessibility of the trigger button itself.
