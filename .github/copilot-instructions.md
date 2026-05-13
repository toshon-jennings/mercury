# Hermes Desktop – Copilot Instructions

Hermes Desktop is a cross-platform Electron app (macOS / Windows / Linux) that manages the installation, configuration, and operation of the **Hermes AI Agent**.

## Commands

```bash
npm run dev           # Start app with hot-reload
npm run dev:fresh     # Start with a clean, isolated HERMES_HOME (useful for testing install flow)
npm run typecheck     # Run TS checks for both Node and Web contexts
npm run lint          # ESLint check
npm run test          # Run full Vitest suite (jsdom env)
npm run test:watch    # Vitest in watch mode

# Run a single test file
npx vitest run tests/sse-parser.test.ts
```

Before submitting changes: `npm run lint && npm run typecheck`.

## Architecture

The app follows the standard `electron-vite` three-process model:

```
src/main/       Node.js — IPC handlers, process spawning, file system, Hermes/Claw3d integration
src/preload/    Secure bridge — exposes hermesAPI to the renderer via contextBridge
src/renderer/   React 19 SPA — UI, screens, components
src/shared/     Types and i18n locales shared by main and renderer
```

### IPC contract

All IPC channels are **defined in one place each side**:
- `src/main/index.ts` — every `ipcMain.handle(...)` registration
- `src/preload/index.ts` — the `hermesAPI` object exposed via `contextBridge`

Renderer code accesses Hermes through `window.hermesAPI.*` (typed via `src/preload/index.d.ts`).  
Never call `ipcRenderer` directly from renderer code.

When adding a new IPC channel: add the handler in `src/main/index.ts`, add the typed wrapper in `src/preload/index.ts`, and add the type declaration in `src/preload/index.d.ts`. The test `tests/ipc-handlers.test.ts` asserts that every `ipcMain.handle` channel has a matching `ipcRenderer.invoke` in the preload — it will catch mismatches.

### App startup flow

`App.tsx` drives a linear state machine:

```
splash → welcome → installing → setup → main (Layout)
```

On launch it checks connection mode (local / remote / SSH) and install status, then routes accordingly. `Layout.tsx` owns the sidebar navigation and renders the active view component.

### Chat / SSE streaming

Chat messages are sent from the renderer → main via `sendMessage` IPC. The main process streams the Hermes HTTP response via SSE. The standalone parser `src/main/sse-parser.ts` is isolated from Electron so it can be unit-tested directly (see `tests/sse-parser.test.ts`).

### Profiles

Hermes supports multiple named profiles stored under `~/.hermes/profiles/<name>/`. Each profile has its own `config.yaml`, `.env`, skills directory, memory, soul, and gateway port. Profile-aware IPC handlers accept an optional `profile?: string` parameter.

### Hermes Home

All agent data lives under `~/.hermes` (or `$HERMES_HOME` if overridden). The desktop app's own settings are persisted to `~/.hermes/desktop.json`.

### Office (Claw3d)

`src/main/claw3d.ts` manages the Claw3d dev server and adapter as child processes. Their ports and env vars are written to `.env` files inside the Hermes home directory.

## Key Conventions

### i18n — required for all UI strings

Every user-visible string must be localized. Add keys to all four locale files:

```
src/shared/i18n/locales/en/
src/shared/i18n/locales/es/
src/shared/i18n/locales/pt-BR/
src/shared/i18n/locales/zh-CN/
```

Use the `useI18n` hook in renderer components:

```tsx
const { t } = useI18n();
<span>{t("navigation.chat")}</span>
```

### Config access pattern (main process)

`src/main/config.ts` — reads/writes `desktop.json` for connection config and app-level settings.  
`src/main/profiles.ts` — profile discovery and metadata.  
Never read config files directly in IPC handlers; go through the helper functions in these modules.

### Path aliases

| Alias | Resolves to |
|---|---|
| `@renderer` | `src/renderer/src` |
| `@shared` | `src/shared` |

### Icons

Use `lucide-react` for icons. The app re-exports a curated subset from `src/renderer/src/assets/icons.ts`. Add new icons there rather than importing from `lucide-react` directly in components.

### Testing patterns

- Tests in `src/**/*.test.ts(x)` co-located with source, or in `tests/` for integration-style tests
- Main-process modules (e.g. `sse-parser.ts`, `installer.ts`) are extracted to be testable without Electron
- `tests/ipc-handlers.test.ts` enforces the preload/main IPC surface contract — don't break it
- Renderer component tests use `@testing-library/react` with the jsdom environment
