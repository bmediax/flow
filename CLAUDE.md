# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flow is an open-source browser-based ePub reader featuring grid layout, search, image preview, custom typography, highlights/annotations, theming, and cloud storage sync (Dropbox).

## Build & Development Commands

```bash
pnpm install              # Install dependencies (rerun after workspace changes)
pnpm dev                  # Run all apps in parallel with hot reload
pnpm build                # Production build for all workspaces
pnpm lint                 # ESLint + Next.js checks across all workspaces

# Single app development
pnpm --filter @flow/reader dev    # Reader app on port 7127
pnpm --filter @flow/website dev   # Website on port 7117

# Testing (epubjs package only)
pnpm --filter @flow/epubjs test   # Karma/Mocha suite (requires Chrome headless)
```

## Architecture

**Monorepo** using pnpm workspaces + Turborepo:

- **apps/reader** - Next.js ePub reader client (port 7127)
  - Uses Recoil for state management, Dexie (IndexedDB) for local storage
  - Integrates `@flow/epubjs` for ePub parsing/rendering
  - Key directories: `src/components/`, `src/hooks/`, `src/models/`, `src/pages/`

- **apps/website** - Marketing site (port 7117)
  - Next.js with MDX support

- **packages/epubjs** - Vendored fork of epub.js for ePub parsing/rendering

- **packages/internal** - Shared React/TypeScript utilities

- **packages/tailwind** - Shared Tailwind CSS preset

## Code Style

- TypeScript-first (`.ts`/`.tsx`)
- Prettier: single quotes, no semicolons, trailing commas
- ESLint extends Next.js defaults
- Components: PascalCase; Hooks: camelCase with `use` prefix; Routes: kebab-case

## Environment Setup

Copy `.env.local.example` to `.env.local` in each app directory before development.

## Commit Convention

Conventional Commits with scopes: `feat:`, `fix:`, `chore(reader):`, etc.
