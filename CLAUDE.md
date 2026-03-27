# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # One-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server with Turbopack (http://localhost:3000)
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Run all Vitest tests
npx vitest run src/path/to/__tests__/file.test.tsx  # Run a single test file
npm run db:reset     # Reset SQLite database
```

Set `ANTHROPIC_API_KEY` in `.env` to use Claude; omit it to use the built-in mock provider.

## Architecture Overview

**UIGen** is a Next.js 15 App Router application where users describe React components in a chat and see a live preview instantly — no files are written to disk.

### Core Data Flow

```
User prompt → ChatContext (useAIChat) → POST /api/chat
  → streamText() with Claude Haiku
  → AI calls str_replace_editor / file_manager tools
  → VirtualFileSystem updated in-memory
  → JSX Transformer (Babel) transpiles files
  → Iframe preview updated via blob URLs
  → (if authenticated) persisted to SQLite via Prisma
```

### Key Abstractions

**VirtualFileSystem** (`src/lib/file-system.ts`)
An in-memory tree structure (no disk I/O). Stores all generated files as nodes. Serializes/deserializes to JSON for database persistence.

**FileSystemContext** (`src/lib/contexts/file-system-context.tsx`)
React context wrapping VirtualFileSystem. Provides file CRUD methods to the UI and handles tool call execution from the AI stream.

**ChatContext** (`src/lib/contexts/chat-context.tsx`)
Wraps Vercel AI SDK's `useAIChat`. Intercepts AI tool calls, delegates file operations to FileSystemContext, and manages anonymous session tracking.

**JSX Transformer** (`src/lib/transform/jsx-transformer.ts`)
Client-side Babel transpiler. Converts the VFS contents to browser-executable JS, builds an import map with blob URLs for each file, and injects into an iframe srcdoc.

**AI Provider** (`src/lib/provider.ts`)
Returns a real Claude Haiku model when `ANTHROPIC_API_KEY` is set, or a `MockLanguageModel` (generates static Counter/Form/Card components) when the key is absent.

### Route Structure

- `/` — root page; redirects authenticated users to their latest project or creates a new one; anonymous users see the chat UI
- `/[projectId]` — loads a specific project with its messages and file data
- `/api/chat` — streaming AI endpoint; persists state to DB on stream completion if `projectId` provided
- `/api/projects` — project CRUD (auth-protected)

### UI Layout

Three-panel resizable layout in `src/app/main-content.tsx`:
- **Left (35%):** Chat interface (message list + input)
- **Right (65%):** Tabbed view — "Preview" (live iframe) or "Code" (FileTree + Monaco editor)

### Authentication

JWT in HTTP-only cookies (7-day expiry, via `jose`). Middleware at `src/middleware.ts` protects `/api/projects` and `/api/filesystem`. Passwords hashed with bcrypt (8-char minimum).

### Database

SQLite via Prisma. Schema: `User` → `Project[]`. Projects store messages as JSON string and the serialized VirtualFileSystem as JSON. Prisma client generates to `src/generated/prisma`.

### Testing

Tests live in `__tests__/` subdirectories next to the code they test. Uses Vitest + React Testing Library + jsdom.
