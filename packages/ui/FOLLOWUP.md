# Follow-ups

Findings from a review of the `packages/ui` components. "Confirmed" items were
reproduced with a throwaway test; the rest come from reading the source.

## Bugs

## Duplication and inconsistencies

- **Disabled checks** are a mix of `disabled === true` (24) and
  `disabled ?? false` (8).
- **No site docs pages** for FocusGroup or MaskedInput.
