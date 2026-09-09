---
"@torpor/ui": minor
---

Feat: split DatePicker into subcomponents

The `DatePicker` is now composed of a `DatePickerTrigger` (the display
button, with slot content for custom labels) and a `DatePickerContent`
(the calendar popout, rendering the selectable calendar by default), each
with their own props and styling. With no children everything is still
rendered automatically, so existing usage is unchanged.
