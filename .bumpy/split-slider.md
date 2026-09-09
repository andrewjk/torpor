---
"@torpor/ui": minor
---

Feat: split Slider into subcomponents

The `Slider` is now composed of `SliderRange` (the filled portion) and
`SliderHandle` (the thumb, carrying `role="slider"` and the keyboard
interaction), each with its own props and styling. With no children the
range and handle are still rendered automatically, so existing usage is
unchanged.
