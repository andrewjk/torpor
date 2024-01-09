# Example

```
<script>
self.PropTypes = {
    names: string[]
}

self.props = {
    names: []
}

self.state = {
    counter: 0,
    get is_even() {
        return this.counter % 2 === 0
    },
    posts: []
}
</script>

<template>
    <p>
        @// This is reactive, and updates when state.counter changes
        The count is {state.counter}.
    </p>
    @// This is reactive, and updates when state.is_even changes
    @// It adds the resulting nodes to the output (in a stack?)
    @if (state.is_even) {
        <p>
            The count is even.
        </p>
    } else {
        <p>
            The count is odd.
        </p>
    }
    @// This is also reactive, and reconciles the lists somehow
    <ul>
    @for (let name of props.names) {
        <li key={name}>{name}</li>
    } else {
        <p>
            No names...
        </p>
    }
    </ul>
    @// How about functions??
    @props.names.sort().forEach((name, i) => {
        <p>{i + 1}: {name}</p>
    })
    @// We could also do switches
    @switch (state.counter) {
        @case 0: {
            <p>Nothing yet...</p>
        }
        @case 1: {
            <p>One</p>
        }
        @default: {
            <p>More than one</p>
        }
    }
    @// And while, do while etc
    @// Custom function for await/then/catch?
    @await loadThings() {
        <p>Loading...</p>
    } then {
        <p>Things</p>
    } catch {
        <p>Something went wrong!</p>
    }
    @// Blocks of JavaScript
    @{
        console.log("I'm in a block")
    }
    @// Variables
    @var x = 5;
    @let y = 10;
    @const z = 15;
    @// Shortcuts for `state.` and `props.`
    <p>
        {$counter}, {$$names.length}
    </p>

    @// This gets merged into the head. Or should this be its own tag like template/style?
    @head {
        <meta etc>
    }

    @// Unescaped HTML
    @html()
</template>

<style />
```
