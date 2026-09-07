# Mercury: Project Instructions # Hermes Desktop: Project Instructions & Context Context

This document serves as the primary architectural and conventional guide for **Hermes Desktop**. It is intended to provide persistent context for developers and AI agents working within this repository.

## Project Overview
Mercury is a native cross-platform application (macOS, Windows, Linux) designed to manage the installation, configuration, and operation of the **Hermes Agent**.

### Core Tech Stack
- **Electron 39**: Shell for cross-platform desktop integration.
- **React 19**: Frontend UI library.
- **TypeScript 5.9**: Type safety across the entire codebase.
- **Vite 7 + electron-vite**: Development server and build pipeline.
- **Tailwind CSS 4**: Utility-first styling.
- **better-sqlite3**: Local database for session storage and FTS5 search.
- **Vitest**: Modern test runner for unit and integration testing.

## Project Structure
The repository follows the standard `electron-vite` structure, separating concerns into four main directories under `src/`:

- `src/main/`: **Main Process**. Handles system-level operations, file system access, process spawning (Claw3d/Hermes), and Electron window management. Node.js environment.
- `src/preload/`: **Preload Scripts**. The secure IPC bridge between the Main and Renderer processes.
- `src/renderer/`: **Renderer Process**. The React frontend. Standard web environment.
- `src/shared/`: **Shared Utilities**. Types, constants, and i18n locales used by both Main and Renderer processes.

## Building and Running
The project uses `npm` for task management. All commands should be run from the root directory.

### Development
- `npm run dev`: Starts the application in development mode with hot-reload.
- `npm run typecheck`: Runs TypeScript compilers for both Node and Web contexts.

### Testing & Linting
- `npm run test`: Runs the Vitest test suite.
- `npm run lint`: Checks for linting errors using ESLint.
- `npm run format`: Formats code using Prettier.

### Packaging
- `npm run build`: Generates production builds for all platforms.
- `npm run build:mac`: Specifically builds the macOS application and generates a `.dmg`.
- `npm run build:win`: Builds the Windows `.exe` installer.
- `npm run build:linux`: Builds Linux distributions (`.AppImage`, `.deb`, `.rpm`).

## Key Workflows & Conventions
- **IPC Handlers**: IPC communication is centralized in `src/main/index.ts` and exposed via the `hermesAPI` object in `src/preload/index.ts`.
- **SSE Streaming**: Chat responses are handled via Server-Sent Events (SSE). The parser is located in `src/main/sse-parser.ts`.
- **Hermes Home**: The agent, config, and logs are centrally managed in `~/.hermes`.
- **Office Integration**: The "Office" feature (Claw3d) manages its own dev server and adapter ports, configurable in the UI and bridged to `.env` files in `src/main/claw3d.ts`.
- **i18n**: All UI strings must be localized in `src/shared/i18n/locales/`.

## Deployment & Release
Packaging is handled by `electron-builder`. Configuration for build targets, icons, and entitlements can be found in `electron-builder.yml`.

---
*Note: This file is a foundational mandate. Prioritize the instructions here over general defaults.*
