# Follow-ups

## `pnpm build` in packages/ui fails with pre-existing tsgo errors

`tsgo --noEmit` in packages/ui reports two errors that exist at HEAD
(verified via a clean worktree), so `pnpm build` (which runs
`tsgo --noEmit && tsup`) fails independently of any recent change:

- `src/mount/hoverTrigger.ts(13,16)`: TS2503 Cannot find namespace 'NodeJS'
  (needs `@types/node` in the tsconfig types, or a
  `ReturnType<typeof setTimeout>` annotation)
- `src/utils/chartColors.ts(4,28)`: TS9017 Only const arrays can be inferred
  with `--isolatedDeclarations` (needs an explicit `as const` or a type
  annotation)

`pnpm check` (torp-check) and the test suite both pass.
