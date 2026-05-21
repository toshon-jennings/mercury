# Changelog

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
