---
title: Async
publish_date: 2026-09-11
---

Async data fetching is now a first-class part of Torpor. No extra libraries, no
manual loading flags, just wrap your fetch in an `$async` getter and your UI in
an `@await` statement and you're done.

## The basics

Put a promise-returning function inside `$async`:

```
let $state = $watch({
	get user() {
		return $async(() => fetchUser($props.id))
	}
})
```

Then read it in your markup. Use an `@await` statement to show a loading state
while the promise is pending:

```
@await {
	<p>Hello, {$state.user?.name}!</p>
} with {
	<p>Loading...</p>
}
```

When the fetch finishes, the content swaps in automatically. If the promise
throws, catch it with `@try`/`@catch` (see [Errors](/docs/errors)).

## A few extras

- `$pending(() => $state.user)` is `true` while the getter is loading which is
  handy for disabling a button or showing a spinner inline
- `$refresh(() => $state.data)` re-runs the getters read within it, for refresh
  buttons and polling
- Pass `{ source: "server" }` to fetch during the server render instead, so the
  content ships resolved with the page

That's the gist of it. For the full story, see the [Async docs](/docs/async).
