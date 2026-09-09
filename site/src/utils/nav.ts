export interface SidebarLink {
	label: string;
	href: string;
}

export interface NavSection {
	/** The label shown for this section in the navigation */
	label: string;
	/** The root path of this section */
	href: string;
	/** The links to show in this section's sidebar (and in the nav drawer) */
	links: ReadonlyArray<SidebarLink>;
}

export const DOC_LINKS: ReadonlyArray<SidebarLink> = [
	{ label: "Overview", href: "/docs" },
	{ label: "Getting Started", href: "/docs/getting-started" },
	{ label: "Components", href: "/docs/components" },
	{ label: "Markup", href: "/docs/markup" },
	{ label: "State", href: "/docs/state" },
	{ label: "Reactivity", href: "/docs/reactivity" },
	{ label: "Binding", href: "/docs/binding" },
	{ label: "Events", href: "/docs/events" },
	{ label: "Slots", href: "/docs/slots" },
	{ label: "Context", href: "/docs/context" },
	{ label: "Async", href: "/docs/async" },
	{ label: "Streams", href: "/docs/streams" },
	{ label: "Transitions", href: "/docs/transitions" },
	{ label: "Errors", href: "/docs/errors" },
	{ label: "Styles", href: "/docs/styles" },
	{ label: "Special Tags", href: "/docs/special-tags" },
	{ label: "Comparisons", href: "/docs/comparisons" },
];

export const UI_LINKS: ReadonlyArray<SidebarLink> = [
	{ label: "Overview", href: "/ui" },
	{ label: "Accordion", href: "/ui/accordion" },
	{ label: "Breadcrumb", href: "/ui/breadcrumb" },
	{ label: "Calendar", href: "/ui/calendar" },
	{ label: "Carousel", href: "/ui/carousel" },
	{ label: "Charts", href: "/ui/charts" },
	{ label: "CommandPalette", href: "/ui/command-palette" },
	{ label: "ComboBox", href: "/ui/combo-box" },
	{ label: "Contextual", href: "/ui/contextual" },
	{ label: "DatePicker", href: "/ui/date-picker" },
	{ label: "DateRangePicker", href: "/ui/date-range-picker" },
	{ label: "DataGrid", href: "/ui/data-grid" },
	{ label: "Dialog", href: "/ui/dialog" },
	{ label: "Drawer", href: "/ui/drawer" },
	{ label: "Form", href: "/ui/form" },
	{ label: "ListBox", href: "/ui/list-box" },
	{ label: "Menu", href: "/ui/menu" },
	{ label: "MenuBar", href: "/ui/menu-bar" },
	{ label: "Modal", href: "/ui/modal" },
	{ label: "NavMenu", href: "/ui/nav-menu" },
	{ label: "NumberInput", href: "/ui/number-input" },
	{ label: "Notification", href: "/ui/notification" },
	{ label: "Pagination", href: "/ui/pagination" },
	{ label: "Popover", href: "/ui/popover" },
	{ label: "Progress", href: "/ui/progress" },
	{ label: "Rating", href: "/ui/rating" },
	{ label: "SelectBox", href: "/ui/select-box" },
	{ label: "SegmentedControl", href: "/ui/segmented-control" },
	{ label: "Slider", href: "/ui/slider" },
	{ label: "Splitter", href: "/ui/splitter" },
	{ label: "Stepper", href: "/ui/stepper" },
	{ label: "TabGroup", href: "/ui/tab-group" },
	{ label: "TagInput", href: "/ui/tag-input" },
	{ label: "TimePicker", href: "/ui/time-picker" },
	{ label: "ToolBar", href: "/ui/tool-bar" },
];

export const BUILD_LINKS: ReadonlyArray<SidebarLink> = [
	{ label: "Overview", href: "/build" },
	{ label: "Routing", href: "/build/routing" },
	{ label: "Loading Data", href: "/build/loading-data" },
	{ label: "Actions", href: "/build/actions" },
	{ label: "API Endpoints", href: "/build/api-endpoints" },
	{ label: "Hooks", href: "/build/hooks" },
	{ label: "Navigation", href: "/build/navigation" },
];

/** The site sections that have their own pages and sidebars */
export const NAV_SECTIONS: ReadonlyArray<NavSection> = [
	{ label: "Docs", href: "/docs", links: DOC_LINKS },
	{ label: "Components", href: "/ui", links: UI_LINKS },
	{ label: "Build", href: "/build", links: BUILD_LINKS },
];
