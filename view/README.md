# tera/view

Tera's view library, for writing and mounting components.

🚧 WARNING: VERY INCOMPLETE 🚧

## Installation

Use `npm` (or `yarn`, or `pnpm`) to add tera/view to your project:

```bash
npm install tera
```

## Features

- As close to plain JS/TS, HTML and CSS as possible
- Component templates
  - In a file with the `.tera` extension
  - Documentation within /\*\* \*/ at the top
  - JS/TS in a <script> tag
  - HTML markup in a (single) HTML tag
  - Styles in a <styles> tag
  - Child components in <template> tags at the bottom
- Use plain JS/TS for markup logic
  - @if statement
  - @for loop
  - @switch statement
  - @await statement for loading data from an async function
  - @const to declare a const variable in markup
  - @console for logging
  - @debugger for debugging
  - @function to declare a function in markup
- Runtime reactivity
  - $watch to create a proxy that updates UI on property sets
  - $run to create an effect that is re-run when its dependencies change
  - $mount to create an effect that runs after a component has been mounted
- Automatic scoping of styles to component
- Two-way binding with bind:value, bind:checked, etc
- Element binding to a script variable with bind:self={...}
- Element in and out transitions using the Web Animations API
- Run an effect when an element is added to the DOM with on:mount={(el) => ...}
- Special tags (mostly not yet implemented...)
  - <:component self={...}> inserts a dynamic component
  - <:element self={...}> inserts a dynamic element
  - <:trim> trims whitespace around the tag
  - <:render> renders HTML e.g. from $props
  - <:head> for adding attributes, events and content to the <head> tag
  - <:window> for adding events to the `window` object
  - <:document> for adding events to the `document` object
  - <:body> for adding events to the `body` object

### Not yet

- Animation

## A component

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
        tasks: []
    })

    // Use the $run function to declare an effect that runs whenever its dependent state changes
    $run(() => {
        if ($state.count === 15) {
            alert("Whoa there")
        }
    })

    // This is an async function
    $state.guesser = guessNumber(1000)
    async function guessNumber(ms) {
        ...
    }
</script>

<div style="margin: auto">
    <h1>Demo</h1>

    <h2>Basic reactivity</h2>
    <p>Put reactive statements in braces, like &lbrace;$state.count&rbrace;.</p>
    <div class="demo">
        <p>
            The count is {$state.count}.
        </p>
        <button onclick={() => $state.count += 1}>Increment</button>
    </div>

    <h2>If statements</h2>
    <p>Use the @if statement to show and hide branches, such as when $state.isEven changes.</p>
    <div class="demo">
        @if ($state.isEven) {
            <p>The count is even.</p>
        } else {
            <p>The count is odd.</p>
        }
    </div>

    <h2>For loops</h2>
    <p>For loops can be used to display and update a list when it changes.</p>
    <div class="demo">
        <button onclick={addTask}>Add a task</button>
        <ul>
            @for (let task of $state.tasks) {
                @key = task.id
                <TaskItem {task} />
            }
        </ul>
        @function addTask() {
            if ($state.tasks.length < 3) {
                $state.tasks.push({
                    id: $state.tasks.length ,
                    text: todo[$state.tasks.length ],
                    done: false
                })
            }
        }
        <p>{$state.tasks.length} tasks, {$state.tasks.filter((t) => t.done).length} done</p>
    </div>

    <h2>Switch statements</h2>
    <p>Switches can also be used (albeit with no break statements and no fallthrough).</p>
    <div class="demo">
        @switch ($state.count) {
            case 0: {
                <p>Nothing yet...</p>
            }
            case 1: {
                <p>The count is one.</p>
            }
            default: {
                <p>The count is more than one.</p>
            }
        }
    </div>

    <h2>Await statements</h2>
    <p>There is a construct for await/then/catch.</p>
    <div class="demo">
        <p>Think of a number between 1 and 10...</p>
        @await ($state.guesser) {
            <p>Hmm...</p>
        } then (number) {
            <p>Is it {number}?</p>
        } catch (ex) {
            <p class="error">Something went wrong: {ex}!</p>
        }
        <button onclick={() => $state.guesser = guessNumber(500)}>
            Guess again
        </button>
    </div>

    <h2>Two way binding</h2>
    <p>Two way binding can be accomplished with bind:value (or bind:checked etc).</p>
    <div class="demo">
        <p>
            Count: <input type="number" bind:value={$state.count} />
        </p>
    </div>

    <h2>Functions</h2>
    <p>You can declare functions in markup with @function.</p>
    <div class="demo">
        <button onclick={resetCount}>Reset the count</button>
        @function resetCount() {
            $state.count = 0
        }
    </div>

    @// Const variables and console logging in markup
    @const z = 15
    @console.log(`const z is ${z}`)

    @// Trigger the debugger in markup -- let's not do this now!
    @// debugger

    @// TODO: Special tags

    <h2>Child components</h2>
    <p>
        Components can be declared in separate files, or within a template tag (see TaskItem, below).
    </p>
</div>

<style>
    .demo {
        border: 1px dashed gray;
        border-radius: 5px;
        padding: 20px;
    }

    .error {
        color: red;
    }
</style>

<template name="TaskItem">
    <li class:done={$props.task.done}>
        <input type="checkbox" bind:checked={$props.task.done} />
        {$props.task.text}
    </li>

    <style>
        li {
            list-style-type: none;
        }
        .done {
            text-decoration: line-through;
        }
    </style>
</template>

```

## Mounting

```
import mount from "tera/view/mount";
import Main from "./Main.tera";

const root = document.getElementById("root");
mount(root, Main);
```
