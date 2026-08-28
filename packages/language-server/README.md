# @torpor/language-server

A language server for [Torpor](https://torpor.dev) ([GitHub](https://github.com/andrewjk/torpor)),
for use in any editor that speaks the Language Server Protocol.

It provides type checking and diagnostics, auto-completion, hover information,
go to definition and more for `.torp` files. Syntax highlighting is handled by
each editor (see below).

## Usage

The `torpor-lsp` binary is installed with the package and defaults to stdio:

```
torpor-lsp --stdio
```

The transport can also be set explicitly with `--node-ipc` or
`--socket={number}` (VS Code uses `--node-ipc`).

The server reads the project's `tsconfig.json`, and resolves imports against
the project's `node_modules`, so it works best inside a Torpor project that
has `@torpor/view` and TypeScript installed.

## Editors

### VS Code

Use the [Torpor extension](https://marketplace.visualstudio.com/items?itemName=Torpor.torpor),
which bundles this server -- see [language-tools](../../language-tools).

### Neovim

With the built-in LSP API (Neovim 0.11+):

```lua
vim.lsp.config.torpor = {
	cmd = { "torpor-lsp", "--stdio" },
	filetypes = { "torpor" },
}
vim.lsp.enable("torpor")
```

For syntax highlighting, a tree-sitter grammar is needed -- the
[@torpor/textmate](../textmate) grammar can be used with a TextMate plugin
(e.g. `nvim-treesitter`'s `tmLanguage` support) in the meantime.

### Helix

In `languages.toml`:

```toml
[[language]]
name = "torpor"
scope = "source.torp"
file-types = ["torp"]
language-servers = ["torpor-lsp"]

[language-server.torpor-lsp]
command = "torpor-lsp"
```

### OpenCode

In `opencode.json`:

```json
{
	"lsp": {
		"torpor": {
			"command": ["torpor-lsp", "--stdio"],
			"extensions": [".torp"]
		}
	}
}
```

### Zed

Not yet supported -- Zed requires an extension package (which registers the
language, grammar and server). See the follow-up notes in the repository.

## Development

This package is part of the Torpor pnpm workspace:

- `@torpor/view` (`workspace:^`) provides the compiler used to transform
  `.torp` files into TypeScript
- TypeScript is kept as an external dependency -- the language server reads
  TypeScript's `lib/*.d.ts` files from disk at runtime (via
  `@typescript/vfs`)

```
pnpm build			# build dist/ (tsdown via vp pack)
pnpm build:watch	# rebuild on change
pnpm check			# typecheck and lint
pnpm test			# run the tests
```
