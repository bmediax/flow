# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Flow is an open-source browser-based ePub reader featuring grid layout, search, image preview, custom typography, highlights/annotations, theming, and cloud storage sync (Dropbox).

## Build & Development Commands

```bash
pnpm install              # Install dependencies
pnpm dev                  # Run dev server on port 7127
pnpm build                # Production build
pnpm lint                 # ESLint + Next.js checks
pnpm start                # Start production server
```

## Architecture

Next.js ePub reader application:

- **src/** - Application source code
  - `components/` - React components
  - `hooks/` - Custom React hooks
  - `models/` - Data models and Dexie (IndexedDB) schemas
  - `pages/` - Next.js pages
  - Uses Recoil for state management

- **lib/** - Local packages
  - `epubjs/` - Vendored fork of epub.js for ePub parsing/rendering
  - `internal/` - Shared React/TypeScript utilities
  - `tailwind/` - Shared Tailwind CSS preset

- **public/** - Static assets

## Code Style

- TypeScript-first (`.ts`/`.tsx`)
- Prettier: single quotes, no semicolons, trailing commas
- ESLint extends Next.js defaults
- Components: PascalCase; Hooks: camelCase with `use` prefix; Routes: kebab-case

## Environment Setup

Copy `.env.local.example` to `.env.local` before development.

## Commit Convention

Conventional Commits with scopes: `feat:`, `fix:`, `chore:`, etc.
