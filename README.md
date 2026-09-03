# Torpor

Torpor is a full-stack JavaScript framework that aims for simplicity and completeness.

## Features

- Compose your views with JavaScript, HTML and CSS
- Components are functions with script, markup and styles
- In-markup JavaScript logic with `@if`, `@for`, `@switch`, `@try/@catch`, and `@await` (async boundary) keywords
  - And `@replace`, `@const`, `@console`, `@debugger`, `@function` and `@html`
- Runtime reactivity via proxies that can be used in any JavaScript file
- Scoped styles, two-way binding, child components and more -- see [torpor/view](./packages/view)
- An accessible, unstyled component library -- see [torpor/ui](./packages/ui)
- A site and app framework -- see [torpor/build](./packages/build)

### Not Yet

- [torpor/dev-tools](./dev-tools) -- Browser development tools
- Performance

## Language Tools

You can install the Torpor extension for VS Code by searching in the extensions sidebar or from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Torpor.torpor). It provides syntax highlighting, type checking, auto-completion, hover information and go to definition for `.torp` files.

The language server is also available as a standalone package, [@torpor/language-server](./packages/language-server), for use in any LSP-capable editor (e.g. Neovim, Helix, but not yet Zed). See [packages/language-server](./packages/language-server) for editor setup details.

## A Simple Component

See the [torpor/view](./packages/view) sub-repo for a more in-depth example.

```
/**
 * Components are functions that are declared in a `.torp` file
 */
export default function Component($props: { name: string }) {
    // Use the $watch function to declare reactive state
    let $state = $watch({
        count: 0,
        get isEven() {
            return this.count % 2 === 0
        },
    })

    // Put your HTML markup in a @render section
    @render {
        <h2>Hello, {$props.name}!</h2>

        <button onclick={() => $state.count++}>
            Increment
        </button>

        <p>
            The count is {$state.count}.
        </p>

        @if ($state.isEven) {
            <p>It is even.</p>
        } else {
            <p>It is odd.</p>
        }
    }

    // Put your CSS styles in a @style section
    @style {
        .demo {
            border: 1px dashed gray;
            border-radius: 5px;
            padding: 20px;
        }
    }
}

```

## Installation

You almost certainly want to use [torpor/build](./packages/build), Torpor's
full-stack framework, to build a site with Torpor:

```bash
npm init @torpor/build@latest my-project
cd my-project
npm install
npm run dev
```

Otherwise, you can add Torpor's view layer directly to your project:

```bash
npm install @torpor/view
```

Clone Torpor to view its source and run a demo (this is a
[pnpm](https://pnpm.io) workspace, so the packages need to be installed and
built from the root first):

```bash
git clone https://github.com/andrewjk/torpor.git
cd torpor
pnpm install
pnpm build
cd examples/demo
pnpm run dev
```
