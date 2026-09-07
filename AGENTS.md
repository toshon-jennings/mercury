# AGENTS.md — Mercury

> Agent rules and operating procedures for the Mercury project.
> Read this before making any changes.

## Project Context

Mercury is a companion R&D agent project alongside Perci, exploring agent
optimization frameworks. It is the evolution of Hermes Desktop, going in its own
direction. Part of broader custom OS research exploring a modern, "AI-baked" Linux
distribution using the Niri scrollable-tiling window manager and Wayland.
Legend-themed (Roman messenger god).

- **Local path:** `/Users/toshonjennings/mercury`
- **Repo:** `github.com/toshon-jennings/mercury`

## Relationship to Hermes

Mercury uses the upstream Hermes Agent runtime for agent behavior and tool
execution. Mercury owns the desktop experience: setup, UI, packaging, local model
discovery, and product direction.

## Design Gate

Before writing any new feature code or making non-trivial changes, state what you're
planning to build and wait for explicit approval. Do not start implementation until
confirmed.

## Git Workflow
- Treat `origin/main` as source of truth.
- Work on `main` directly unless explicitly asked for a branch.
- Sync local `main` from `origin/main` before editing or pushing.

## Debugging

Never propose a fix before identifying root cause:
1. Read the full error and stack trace
2. Confirm you can reproduce it
3. Check what recently changed (git diff, recent commits, env vars)
4. In multi-component failures, add logging at each boundary before guessing
