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

Next.js 15 ePub reader application using the App Router:

- **src/** - Application source code
  - `app/` - Next.js App Router pages and layouts
  - `components/` - React components
  - `hooks/` - Custom React hooks
  - `models/` - Data models and Dexie (IndexedDB) schemas
  - `state.ts` - Global state using Jotai
  - `db.ts` - Dexie database configuration
  - `sync.ts` - Dropbox sync logic

- **lib/** - Local packages
  - `epubjs/` - Vendored fork of epub.js for ePub parsing/rendering
  - `internal/` - Shared React/TypeScript utilities
  - `tailwind/` - Shared Tailwind CSS preset

- **public/** - Static assets and PWA files

## Code Style

- TypeScript-first (`.ts`/`.tsx`)
- Prettier: single quotes, no semicolons, trailing commas
- ESLint extends Next.js defaults
- Components: PascalCase; Hooks: camelCase with `use` prefix; Routes: kebab-case

## Key Dependencies

- **React 19** with Next.js 15
- **Jotai** for atomic state management
- **Dexie** for IndexedDB persistence
- **Tailwind CSS** for styling

## Environment Setup

Copy `.env.local.example` to `.env.local` before development.

## Commit Convention

Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, etc.
