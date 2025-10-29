import { $watch, mount } from "@torpor/view";
import { browser } from "wxt/browser";
import { type Boundary, type State } from "./Boundary";
// @ts-ignore
import Panel from "./Panel.torp";

let interval: NodeJS.Timeout;

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
if (globalThis.T_DEV_CTX) {
	//console.log(JSON.stringify(globalThis.T_DEV_CTX, null, 2));
	globalThis.T_DEV_CTX.format();
}
`;

	// Keep expanded entries as-is
	// TODO: Maybe we should reload their details?
	let oldBounds = new Map<string, Boundary>();
	for (let b of $state.data.boundaries) {
		oldBounds.set(b.id, b);
	}
	//let expanded = [];
	//let recent = [];
	//let details: Record<string, string> = {};
	//for (let b of $state.data.boundaries) {
	//	if (b.expanded) {
	//		expanded.push(b.id);
	//		details[b.id] = b.details;
	//	}
	//	if (b.recent) {
	//		recent.push(b.id);
	//	}
	//}

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
			console.log(
				"GOT",
				result.boundaries.map((b: any) => ({ name: b.name, id: b.id })),
			);
			// Add some fields to the boundaries we received
			$state.data.boundaries = result.boundaries.map(
				(b: Boundary) =>
					({
						type: b.type,
						id: b.id,
						name: b.name,
						depth: b.depth,
						expanded: oldBounds.get(b.id)?.expanded ?? false,
						details: oldBounds.get(b.id)?.details ?? "",
						recent: oldBounds.get(b.id)?.recent ?? true,
						onexpand: expandBoundary,
						onmark: markBoundary,
						onunmark: unmarkBoundaries,
					}) satisfies Boundary,
			);

			if (interval) {
				clearTimeout(interval);
			}
			interval = setTimeout(() => {
				$state.data.boundaries.forEach((b) => (b.recent = false));
			}, 2000);
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
		boundary.details = "";
		return;
	}

	const script = `
if (globalThis.T_DEV_CTX) {
	globalThis.T_DEV_CTX.getDetails("${id}");
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
if (globalThis.T_DEV_CTX) {
	globalThis.T_DEV_CTX.mark("${id}");
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
if (globalThis.T_DEV_CTX) {
	globalThis.T_DEV_CTX.unmark();
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

browser.runtime.onMessage.addListener((text: string, _sender, _sendResponse) => {
	const message = JSON.parse(text);
	if (message.name === "REFRESH") {
		loadDevContext();
	} else if (message.name === "Effect run") {
		const boundary = $state.data.boundaries.find((b) => b.id === message.id);
		if (boundary !== undefined) {
			boundary.recent = true;
		}
	} else if (message.name === "Signal set") {
		const boundary = $state.data.boundaries.find((b) => b.id === message.id);
		if (boundary !== undefined) {
			boundary.recent = true;
		}
	}
});
