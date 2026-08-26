import { defineConfig, type UserConfig } from "vite-plus";

const components = [
	"Accordion",
	"Breadcrumb",
	"Calendar",
	"Carousel",
	"Charts",
	"ComboBox",
	"CommandPalette",
	"Contextual",
	"DatePicker",
	"DateRangePicker",
	"Dialog",
	"Disclosure",
	"Drawer",
	"FileDropzone",
	"Form",
	"ListBox",
	"Menu",
	"MenuBar",
	"Modal",
	"NavMenu",
	"NumberInput",
	"Notification",
	"Pagination",
	"Progress",
	"Popover",
	"Rating",
	"SelectBox",
	"SegmentedControl",
	"Slider",
	"Splitter",
	"Stepper",
	"TabGroup",
	"TagInput",
	"Tree",
	"ToolBar",
	"icons",
	"motion",
];

/**
 * `.torp` component files are copied to the output folder as-is, and their
 * imports are kept external so that consumers compile them with
 * @torpor/unplugin
 */
export default defineConfig({
	pack: {
		entry: Object.fromEntries(components.map((c) => [`${c}/index`, `src/${c}/index.ts`])),
		format: "esm",
		platform: "neutral",
		sourcemap: true,
		exports: false,
		dts: { entry: ["src/motion/index.ts"] },
		deps: { neverBundle: [/\.torp$/] },
		copy: [{ from: [...components, "utils"].map((c) => `src/${c}/**/*.torp`), flatten: false }],
		onSuccess: "tsx scripts/postbuild.ts",
	},
}) satisfies UserConfig as UserConfig;
