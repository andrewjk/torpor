import { $watch, mount } from "@torpor/view";
import { browser } from "wxt/browser";
import { type Boundary, type State } from "./Boundary";
// @ts-ignore
import Panel from "./Panel.torp";

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
	//console.log(JSON.stringify(globalThis.T_DEV_CONTEXT, null, 2));
	globalThis.T_DEV_CONTEXT.format();
}
`;

	// Keep expanded entries as-is
	// TODO: Maybe we should reload their details?
	let expanded = [];
	let details: Record<string, string> = {};
	for (let b of $state.data.boundaries) {
		if (b.expanded) {
			expanded.push(b.id);
			details[b.id] = b.details;
		}
	}

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
				expanded: expanded.includes(b.id),
				details: details[b.id] ?? "",
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
if (globalThis.T_DEV_CONTEXT) {
	globalThis.T_DEV_CONTEXT.getDetails("${id}");
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
if (globalThis.T_DEV_CONTEXT) {
	globalThis.T_DEV_CONTEXT.mark("${id}");
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
if (globalThis.T_DEV_CONTEXT) {
	globalThis.T_DEV_CONTEXT.unmark();
}`;

	browser.devtools.inspectedWindow.eval(script, function (result: any, isException) {
		if (isException) {
			$state.error = JSON.stringify(isException, null, 2);
			$state.warning = "";
		}
	});
}

// Setup messaging

// TODO: Re-add this when tab changes etc
browser.scripting.executeScript({
	target: {
		tabId: browser.devtools.inspectedWindow.tabId,
	},
	func: () => {
		window.addEventListener("message", function (event) {
			// Only accept messages from the same frame
			if (event.source !== window) {
				return;
			}

			var message = event.data;

			// Only accept messages that we know are ours. Note that this is not foolproof
			// and the page can easily spoof messages if it wants to
			if (typeof message !== "object" || message === null || message.source !== "t_dev_tools") {
				return;
			}

			// @ts-ignore TODO: Does this work in Firefox?
			chrome.runtime.sendMessage(message.message);
		});
	},
	//files: ["example.js"],
});

browser.runtime.onMessage.addListener((message: string, _sender, _sendResponse) => {
	//console.log("MESSAGE", message);

	if (message === "REFRESH") {
		loadDevContext();
	}
});
