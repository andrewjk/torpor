# Torpor

This is the Visual Studio Code language server for [Torpor](https://torpor.dev) ([Github](https://github.com/andrewjk/torpor)).

Torpor is a full-stack JavaScript framework that aims for simplicity and completeness.

The language server provides syntax highlighting, type checking and auto-completion for `.torp` files, which look something like this:

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
