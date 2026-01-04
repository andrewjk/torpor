# Agent Guidelines

## Commands

### Build & Typecheck

- `pnpm build` - Build all packages recursively
- `pnpm check` - Typecheck all packages recursively
- In individual packages: `pnpm check` runs `tsgo --noEmit && pnpm dlx oxlint --type-aware`

### Linting

- Root: `pnpm format` - Format all files with prettier
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

- Use **tabs** for indentation (enforced by prettier)
- Print width: **100 characters**
- Trailing commas: **all** (except in JSON files)
- Semi-colons: **required**

### Imports

- Sorted with `@trivago/prettier-plugin-sort-imports`
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
