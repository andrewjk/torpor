---
"@torpor/ui": minor
---

Feat: split DataGrid into subcomponents

The `DataGrid` table is now rendered from `DataGridColumnHeader` (one
sortable header cell each) and `DataGridCell` (one body cell each, carrying
the roving tabindex) subcomponents, each with their own props, styling and
slots. The cell template, sorting, paging, loading and keyboard APIs are
unchanged.
