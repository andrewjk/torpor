# Tera

Yet another JavaScript framework, designed for simplicity.

🚧 WARNING: VERY INCOMPLETE 🚧

## Features

- As close to plain JS/TS, HTML and CSS as possible
- Component templates with script, markup and styles
  - And optional documentation and child components
- Use plain JS/TS for markup logic with @if, @for, @switch and @await keywords
  - And @replace, @const, @console, @debugger and @function
- Runtime reactivity via proxies that can be used in any JS/TS file
- Two-way binding, scoped styles, child templates and more -- see [tera/view](./view)
- An accessible, unstyled component library -- see [tera/ui](./ui)
- A rudimentary site building framework -- see [tera/kit](./kit)

### Not yet

- [tera/lsp](./lsp) -- Language server for IDEs
- [tera/docs](./docs) -- Documentation, REPL, etc
- [tera/dev](./dev) -- Browser devtools
- Performance

## A simple component

See the [tera/view](./view) sub-repo for a more in-depth example.

```
/**
 * Components are declared in a file with docs, script, markup and styles
 * @prop {string} name - This is a strongly typed prop which can be accessed through $props
 */

<script>
    // Use the $watch function to declare reactive state
    const $state = $watch({
        count: 0,
        get isEven() {
            return this.count % 2 === 0
        },
    })
</script>

<div class="demo">
    @// Use braces to set reactive text
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

<style>
    .demo {
        border: 1px dashed gray;
        border-radius: 5px;
        padding: 20px;
    }
</style>

```

## Installation

Use `npm` (or your preferred package manager) to add tera to your project:

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
