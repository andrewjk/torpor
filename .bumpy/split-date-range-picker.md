---
"@torpor/ui": minor
---

Feat: split DateRangePicker into subcomponents

The `DateRangePicker` is now composed of a `DateRangePickerTrigger` (the
display button, with slot content for custom labels) and a
`DateRangePickerContent` (the calendar popout, rendering the range calendar
by default), each with their own props and styling. With no children
everything is still rendered automatically, so existing usage is unchanged.
