# Torpor

This is the Visual Studio Code language server for [Torpor](https://torpor.dev) ([Github](https://github.com/andrewjk/torpor)).

Torpor is yet another JavaScript framework, designed for simplicity and completeness.

The language server provides syntax highlighting for `.torp` files, which contain components, and look something like this:

```
/**
 * A simple counter component.
 */
export default function Counter() {
    // Use the $watch function to declare reactive state
    const $state = $watch({
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
