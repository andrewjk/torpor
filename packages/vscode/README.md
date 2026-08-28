# Torpor for VS Code

This is the Visual Studio Code extension for [Torpor](https://torpor.dev)
([GitHub](https://github.com/andrewjk/torpor)).

Torpor is a full-stack JavaScript framework that aims for simplicity and
completeness.

The extension provides language support for `.torp` files:

- Syntax highlighting (via the TextMate grammar in
  [@torpor/textmate](../textmate))
- Type checking and diagnostics, powered by the Torpor compiler and the
  TypeScript compiler
- Auto-completion for script, HTML and CSS regions
- Hover information and go to definition
- Document symbols and selection ranges

A `.torp` file looks something like this:

```
/**
 * A simple counter component.
 */
export default function Counter() {
	// Use the $watch function to declare reactive state
	let $state = $watch({
		count: 0,
	})

	// HTML markup goes in a @render section
	@render {
		<button onclick={() => $state.count++}>
			Increment
		</button>

		<p class="demo">
			The count is {$state.count}.
		</p>
	}

	// CSS styles go in a @style section
	@style {
		.demo {
			border: 1px dashed gray;
			border-radius: 5px;
			padding: 20px;
		}
	}
}
```

## Development

This package is part of the Torpor pnpm workspace and integrates with the
other packages directly:

- `@torpor/language-server` (`workspace:^`) provides the language server,
  which bundles the Torpor compiler and TypeScript support -- see
  [packages/language-server](../language-server). It lives in its
  own package so that other editors (Neovim, Helix, Zed, ...) can use it too
- `@torpor/textmate` (`workspace:^`) provides the TextMate grammar, which is
  copied into `syntaxes/` as part of the build

### Building

```
pnpm build			# bundle the client and server into dist/
pnpm watch			# rebuild on change
pnpm check			# typecheck and lint
pnpm test			# run the tests
```

The build script bundles the client and server with esbuild. The TypeScript
compiler is kept as an external dependency (the language server reads
TypeScript's `lib/*.d.ts` files from disk at runtime, via `@typescript/vfs`).

### Debugging

Open the `packages/vscode` folder in VS Code and press `F5` ("Launch
Extension"). This starts the watch task and opens a new Extension Development
Host window. To debug the language server itself, use "Attach to Language
Server" after launching.

### Packaging

```
pnpm package		# build and create a .vsix in the current folder
pnpm publish:patch	# bump the patch version and publish to the marketplace
```
