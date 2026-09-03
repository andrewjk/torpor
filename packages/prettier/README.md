# torpor/prettier

A [Prettier](https://prettier.io) plugin for formatting Torpor `.torp` files.

It formats the JavaScript shell of a component with Prettier's TypeScript
parser, and the `@render`/`@head` markup and `@style` sections with Torpor's
own parser (tabs for indentation, attributes wrapped when over the print
width).

## Installation

```bash
npm install --save-dev @torpor/prettier
```

## Usage

Add the plugin to your `.prettierrc`:

```json
{
	"plugins": ["@torpor/prettier"]
}
```

Then format `.torp` files as usual:

```bash
npx prettier --write src/App.torp
```
