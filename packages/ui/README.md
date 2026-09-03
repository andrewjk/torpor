# torpor/ui

Accessible, unstyled components for use in your Torpor front-end.

Each component is exported as a separate subpath (e.g.
`@torpor/ui/Accordion`) and is bundled with sensible behavior and ARIA
attributes, while styling is left up to you.

## Installation

```bash
npm install @torpor/ui
```

## Usage

```torp
import {
	Accordion,
	AccordionContent,
	AccordionHeader,
	AccordionItem,
	AccordionTrigger,
} from "@torpor/ui/Accordion";

@render {
	<Accordion>
		<AccordionItem>
			<AccordionHeader>
				<AccordionTrigger>Header 1</AccordionTrigger>
			</AccordionHeader>
			<AccordionContent>Content 1</AccordionContent>
		</AccordionItem>
	</Accordion>
}
```

## Components

- Accordion
- Breadcrumb
- Calendar
- Carousel
- Charts
- ColorPicker
- ComboBox
- CommandPalette
- Contextual
- DataGrid
- DatePicker
- DateRangePicker
- Dialog
- Disclosure
- Drawer
- FocusGroup
- Form
- icons
- ListBox
- MaskedInput
- Menu
- MenuBar
- Modal
- NavMenu
- Notification
- NumberInput
- Pagination
- Popover
- Progress
- Rating
- SegmentedControl
- SelectBox
- Slider
- Splitter
- Stepper
- TabGroup
- TagInput
- TimePicker
- ToolBar
- Tree

## Motion

Transition helpers for use with the `transition` / `transition-in` /
`transition-out` directives (see [torpor/view](../view)), exported from
`@torpor/ui/motion`:

- `fade`
- `grow`
- `slide`

Plus `measure`, a utility for measuring an element before it is added to the
DOM (used by `grow` and `slide`).
