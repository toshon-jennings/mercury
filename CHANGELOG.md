# Changelog

## [0.6.12] - 2026-05-27

### Fixed
- Cleaned up i18n test warning noise by removing React act(...) warnings from
  the locale provider tests while keeping the macOS Mercury menu branding fix
  in the current release line.

## [0.6.11] - 2026-05-27

### Fixed
- Updated the macOS application menu to use Mercury for system-provided labels
  like About, Hide, and Quit instead of Hermes.

## [0.6.10] - 2026-05-27

### Changed
- Added smarter Hermes maintenance states in Settings so Mercury can show
  plain-English actions like Up to date, Update Hermes, Restore standard
  Hermes, and Repair Hermes instead of relying on a raw "commits behind"
  message.
- Clarified that Hermes maintenance changes Hermes Agent only, not Mercury,
  and softened advanced diagnostics copy for customized or repair-needed
  installs.

### Fixed
- Improved Hermes maintenance recovery so Mercury can normalize a customized
  local Hermes install back to the standard Hermes version and repair broken
  local metadata more safely.
- Fixed app chat stream timeout handling for a more reliable conversation
  experience.

## [0.6.6] - 2025-05-20

### Fixed
- OpenClaw migration now passes `--yes` to the CLI so the non-interactive
  session no longer exits on the "OpenClaw is running" confirmation prompt.
  Migration proceeds and streams the preview log; the conflict warning about
  bot tokens is still visible in the progress output.

## [0.6.5] - 2025-05-20

### Changed
- Replaced all user-visible "OpenClaw" references with "Hermes" across the
  hermes-office UI (agent wizard, event console, settings panels, onboarding
  prerequisites, delete confirmations, and error messages). Internal code
  identifiers are unchanged.

## [0.6.4] - prior release
