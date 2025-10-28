import { $watch, mount } from "@torpor/view";
import { browser } from "wxt/browser";
// @ts-ignore
import Panel from "./Panel.torp";

interface Boundary {
	type: string;
	id: string;
	name: string;
	depth: number;
	expanded: boolean;
	details: string;
	onexpand: (id: string) => void;
}

interface State {
	warning: string;
	error: string;
	data: {
		boundaries: Boundary[];
	};
}

let $state: State = $watch({
	warning: "",
	error: "",
	data: {
		boundaries: [],
		reload: loadDevContext,
	},
});

// Retrieve the dev context from the displayed page and reload it on tab change
loadDevContext();
browser.tabs.onActivated.addListener(() => loadDevContext);

// Mount Panel.torp into the dev tools
mount(document.getElementById("app")!, Panel, $state);

// Retrieves the dev context from the displayed page
function loadDevContext() {
	const script = `
if (globalThis.T_DEV_CONTEXT) {
	//console.log(JSON.stringify(globalThis.T_DEV_CONTEXT(), null, 2));
	globalThis.T_DEV_CONTEXT();
}
`;

	browser.devtools.inspectedWindow.eval(script, function (result: any, isException) {
		if (isException) {
			$state.error = JSON.stringify(isException, null, 2);
			$state.warning = "";
			$state.data.boundaries.length = 0;
		} else if (!result) {
			$state.error = "";
			$state.warning = "No dev context found";
			$state.data.boundaries.length = 0;
		} else {
			$state.error = "";
			$state.warning = "";

			// Add some fields to the boundaries we received
			$state.data.boundaries = result.boundaries.map((b: Boundary) => ({
				type: b.type,
				id: b.id,
				name: b.name,
				depth: b.depth,
				expanded: false,
				details: "",
				onexpand: expandBoundary,
				onmark: markBoundary,
				onunmark: unmarkBoundaries,
			}));
		}
	});
}

function expandBoundary(id: string) {
	let boundary = $state.data.boundaries.find((b) => b.id === id);
	if (!boundary) {
		$state.error = "Boundary not found: " + id;
		$state.warning = "";
		return;
	}

	if (boundary.expanded) {
		boundary.expanded = false;
		return;
	}

	const script = `
if (globalThis.T_DEV_DETAILS) {
	globalThis.T_DEV_DETAILS("${id}");
}`;

	browser.devtools.inspectedWindow.eval(script, function (result: any, isException) {
		if (isException) {
			$state.error = JSON.stringify(isException, null, 2);
			$state.warning = "";
		} else if (!result) {
			$state.error = "";
			$state.warning = "No dev details found";
		} else {
			boundary!.details = result;
			boundary!.expanded = true;
		}
	});
}

function markBoundary(id: string) {
	let boundary = $state.data.boundaries.find((b) => b.id === id);
	if (!boundary) {
		$state.error = "Boundary not found: " + id;
		$state.warning = "";
		return;
	}

	const script = `
if (globalThis.T_DEV_MARK) {
	globalThis.T_DEV_MARK("${id}");
}`;

	browser.devtools.inspectedWindow.eval(script, function (result: any, isException) {
		if (isException) {
			$state.error = JSON.stringify(isException, null, 2);
			$state.warning = "";
		}
	});
}

function unmarkBoundaries() {
	const script = `
if (globalThis.T_DEV_UNMARK) {
	globalThis.T_DEV_UNMARK();
}`;

	browser.devtools.inspectedWindow.eval(script, function (result: any, isException) {
		if (isException) {
			$state.error = JSON.stringify(isException, null, 2);
			$state.warning = "";
		}
	});
}
