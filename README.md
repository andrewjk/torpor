# Tera

Yet another JavaScript framework, designed for simplicity, completeness and fun.

🚧 WARNING: VERY INCOMPLETE 🚧

## Features

- Compose your views with JS/TS, HTML and CSS
- Components are functions with script, markup and styles
- In-markup JS/TS logic with @if, @for, @switch and @await keywords
  - And @replace, @const, @console, @debugger, @function and @html
- Runtime reactivity via proxies that can be used in any JS/TS file
- Scoped styles, two-way binding, child components and more -- see [tera/view](./view)
- An accessible, unstyled component library -- see [tera/ui](./ui)
- A rudimentary site and app building framework -- see [tera/kit](./kit)

### Not yet

- [tera/lsp](./lsp) -- Language server for IDEs
- [tera/site](./site) -- Homepage, documentation, REPL, etc
- [tera/dev](./dev) -- Browser devtools
- Performance

## A simple component

See the [tera/view](./view) sub-repo for a more in-depth example.

```
/**
 * Components are functions that are declared in a `.tera` file
 */
export default function Component($props: { name: string }) {
    // Use the $watch function to declare reactive state
    const $state = $watch({
        count: 0,
        get isEven() {
            return this.count % 2 === 0
        },
    })

    // Put your HTML markup in a @render section
    @render {
        <div class="demo">
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
        </div>
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

Use `npm` (or your preferred package manager) to add Tera to your project:

```bash
npm install tera
```

Clone Tera to view its source and run a demo:

```bash
git clone https://github.com/andrewjk/tera.git
cd tera/demo
npm install
npm run dev
```
