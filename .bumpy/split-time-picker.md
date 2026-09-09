---
"@torpor/ui": minor
---

Feat: split TimePicker into subcomponents

The `TimePicker` is now composed of `TimePickerPart` components (the hour,
minute and second spinbutton segments) and a `TimePickerPeriod` (the AM/PM
toggle in 12-hour mode), each with its own props and styling. With no
children the segments are still rendered automatically, so existing usage
is unchanged.
