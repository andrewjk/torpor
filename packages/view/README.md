# torpor/view

Torpor's view library, for writing and mounting components.

🚧 WARNING: WORK IN PROGRESS 🚧

## Installation

Use `npm` (or your preferred package manager) to add Torpor to your project:

```bash
npm install torpor
```

## Features

- Compose your views with JavaScript, HTML and CSS
- Components are functions
  - In a file with the `.torp` extension
  - HTML markup in a `@render` section
  - CSS in a `@style` section
  - Child components in child component functions
- In-markup JavaScript logic
  - @if statement
  - @for loop
  - @switch statement
  - @await statement for loading data from an async function
  - And
    - @replace to re-run a section when a property changes
    - @const to declare a const variable in markup
    - @console for logging
    - @debugger for debugging
    - @function to declare a function in markup
    - @html to render HTML e.g. from $props
- Runtime reactivity
  - $watch to create a proxy that updates UI on property changes
  - $run to create an effect that is re-run when its dependencies change
  - $mount to create an effect that runs after a component has been mounted
  - $unwrap to get the target object from the proxy
- Automatic scoping of styles to component
- Two-way binding with &value, &checked, etc
- Element binding to a script variable with &ref={...}
- Element in and out transitions using the Web Animations API
- Run an effect when an element is added to the DOM with :onmount={(el) => ...}
- Special tags (mostly not yet implemented...)
  - <:component self={...}> inserts a dynamic component
  - <:element self={...}> inserts a dynamic element
  - <:trim> trims whitespace around the tag
  - <:head> for adding content to the <head> tag
  - <:window> for adding events to the `window` object
  - <:document> for adding events to the `document` object
  - <:body> for adding events to the `body` object

### Not yet

- Animation

## A component

```
/**
 * Components are functions that are declared in a `.torp` file
 */
export default function Component($props: { name: string }) {
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

    @render {
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
            <p>Two way binding can be accomplished with &value (or &checked etc).</p>
            <div class="demo">
                <p>
                    Count: <input type="number" &value={$state.count} />
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
                Child components can be declared in separate files and imported, or they can be
                declared as a function in the current file (like TaskItem, below).
            </p>
        </div>
    }

    @style {
        .demo {
            border: 1px dashed gray;
            border-radius: 5px;
            padding: 20px;
        }

        .error {
            color: red;
        }
    }
}

function TaskItem() {
    @render {
        <li :class={{ done: $props.task.done }}>
            <input type="checkbox" &checked={$props.task.done} />
            {$props.task.text}
        </li>
    }

    @style {
        li {
            list-style-type: none;
        }
        .done {
            text-decoration: line-through;
        }
    }
}

```

## Mounting

```
import mount from "torpor/view/mount";
import Main from "./Main.torp";

const root = document.getElementById("root");
mount(root, Main);
```
