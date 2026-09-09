---
"@torpor/ui": patch
---

Fix: TimePicker segments keep updating after moving between parts

Stepping a segment with the arrow keys no longer freezes its displayed
text once another segment has been interacted with. The sync guard now
tracks uncommitted typing exactly (clearing the buffer on every commit)
instead of misreading a focused-but-unedited segment as being edited.
