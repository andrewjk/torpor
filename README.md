# Torpor

Yet another JavaScript framework, designed for simplicity and completeness.

🚧 WARNING: WORK IN PROGRESS 🚧

## Features

- Compose your views with JavaScript, HTML and CSS
- Components are functions with script, markup and styles
- In-markup JavaScript logic with `@if`, `@for`, `@switch` and `@await` keywords
  - And `@replace`, `@const`, `@console`, `@debugger`, `@function` and `@html`
- Runtime reactivity via proxies that can be used in any JavaScript file
- Scoped styles, two-way binding, child components and more -- see [torpor/view](./packages/view)
- An accessible, unstyled component library -- see [torpor/ui](./packages/ui)
- A site and app framework -- see [torpor/build](./packages/build)

### Not Yet

- [torpor/dev-tools](./dev-tools) -- Browser development tools
- Performance

## Language Tools

You can install the Torpor language server for VS Code by searching in the extensions sidebar or from the [Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=Torpor.torpor). The language server currently only provides syntax highlighting for `.torp` files.

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

Use `npm` (or your preferred package manager) to add Torpor to your project:

```bash
npm install torpor
```

Clone Torpor to view its source and run a demo:

```bash
git clone https://github.com/andrewjk/torpor.git
cd torpor/examples/demo
npm install
npm run dev
```
