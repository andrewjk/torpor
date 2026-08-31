# Agent Guidelines

## Torpor framework reference

For the full `.torp` component and `@torpor/view` runtime API (`$watch`,
`$run`, `$handle`, `$mount`, `$peek`, `$batch`, `$cache`, `$bind`, `&ref`,
`&value`, `&group`, slots, context, transitions, directives, etc.), see
[TORPOR_AGENTS.md](TORPOR_AGENTS.md).

## Commands

### Build & Typecheck

- `pnpm build` - Build all packages recursively
- `pnpm check` - Typecheck all packages recursively
- In individual packages: `pnpm check` runs `tsgo --noEmit && pnpm dlx oxlint --type-aware`

### Formatting

- Root: `pnpm format` - Format all files with `vp fmt` (oxfmt)
- Do NOT run prettier; formatting config lives in the `fmt` block of `vite.config.ts`

### Linting

- Individual packages: `pnpm dlx oxlint --type-aware` for type-aware linting

### Testing

- `pnpm test` - Run all tests in watch mode
- `vitest run` - Run all tests once
- `vitest` - Run tests in watch mode
- `vitest run path/to/test.test.ts` - Run a single test file
- `vitest run -t "test name"` - Run tests matching a pattern
- In individual packages: `pnpm test` runs vitest

## Code Style

### Formatting

- Use **tabs** for indentation (enforced by `vp fmt`)
- Print width: **100 characters**
- Trailing commas: **all** (except in JSON files)
- Semi-colons: **required**

### Imports

- Sorted automatically by `vp fmt` (`importOrder` in the `fmt` block of `vite.config.ts`)
- Order: Relative imports first (`../`, `./`), then external
- Use explicit file extensions for TypeScript imports (`.ts`)
- Node.js built-ins use `node:` protocol: `import fs from "node:fs"`

### TypeScript

- Strict mode enabled
- All packages are ESM modules (`"type": "module"`)
- Target: ES2022
- Use type imports: `import type Component from "./types/Component"`
- Export types separately: `export type { Component, Props }`
- Prefer explicit return types for public APIs
- Type-only imports for types used in annotations

### Naming Conventions

- **Variables/Functions**: camelCase (`const myValue`, `function doSomething()`)
- **Classes**: PascalCase (`class Router`)
- **Types/Interfaces**: PascalCase (`type Component`, `interface Props`)
- **Constants**: UPPER_SNAKE_CASE for globals, camelCase for module-level
- **Private members**: Use `#` prefix for truly private class fields
- **Reactive state**: Prefix with `$` (`$state`, `$props`, `$cache`)
- **Internal functions**: Prefix with `_` when appropriate

### Code Organization

- Group related functions in directories (e.g., `render/`, `compile/`, `types/`)
- Export barrel files as `index.ts` with organized sections
- Separate types into dedicated files or directories
- Comment sections with logical headers

### Error Handling

- Use `throw new Error("descriptive message")` for expected errors
- Include context in error messages
- No try/catch at call sites unless specifically needed
- Prefer early returns/throws over deep nesting

### Comments

- Use JSDoc comments for public APIs: `/** Description */`
- Keep comments concise and meaningful
- TODO comments should be actionable
- Mark temporary solutions with `HACK:` prefix

### Component Patterns

- Components are functions returning void (for .torp files)
- Props parameter: `$props: { name: string }`
- Use `$props`, `$state`, `$context` prefixes consistently
- Slot renders: `Record<string, SlotRender>`

### Testing

- Use vitest with jsdom environment
- Import from `@testing-library/dom` and `@testing-library/jest-dom/vitest`
- Test structure: `test("description", async () => { ... })`
- Use descriptive test names
- Group related tests with shared setup in helper functions

### Package Structure

- Use workspace packages with `workspace:^` dependencies
- Separate `src` and `dist` directories
- Export configuration in `package.json` with types and import fields
- Bin scripts go in `dist/bin/`

### Reactivity

- Wrap state with `$watch()` for reactive objects
- Use getters for computed properties
- Access reactive values directly, proxies handle updates
- `$cache` for memoization in getters

## Key Patterns

### File-based routing (torpor/build)

- Pages in `routes/` directory
- Special routes: `_layout`, `_error`, `_hook`
- Server files end with `~server`
- Use `[]` for dynamic segments

### Component compilation (torpor/view)

- Compile .torp files to client/server builds
- Use region-based rendering for performance
- Support hydration from SSR output
- Watch for reactive changes via proxies

### Development tools

- Use `devContext` for dev-only features
- Enable debug modes with environment flags
- Source maps for debugging generated code

#### Follow-Ups

- When you decide **not** to fix a bug or issue inline (e.g. it's out of scope
  for the current task), record it for later by adding a section to
  `FOLLOWUP.md` describing the issue (what you saw, where, and any relevant
  context). Create the file if it does not yet exist.

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
