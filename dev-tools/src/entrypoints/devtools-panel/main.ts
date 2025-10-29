import { $watch, mount } from "@torpor/view";
import { browser } from "wxt/browser";
import { type Boundary, type State } from "./Boundary";
// @ts-ignore
import Panel from "./Panel.torp";

let $state: State = $watch({
	warning: "",
	error: "",
	boundaries: [],
	events: [],

	reload: () => loadDevContext(false),
});

initializeTab();
loadDevContext(false);

function initializeTab() {
	browser.devtools.inspectedWindow.eval('const DEV_CONTEXT_SYMBOL = Symbol.for("t_dev_context");');
	browser.scripting.executeScript({
		target: {
			tabId: browser.devtools.inspectedWindow.tabId,
		},
		func: () => {
			window.addEventListener("message", function (event) {
				// Only accept events from the same frame
				if (event.source !== window) {
					return;
				}

				var message = event.data;

				// Only accept events that we know are ours. Note that this is not foolproof
				// and the page can easily spoof events if it wants to
				if (typeof message !== "object" || message === null || message.source !== "t_dev_tools") {
					return;
				}

				// @ts-ignore TODO: Does this work in Firefox?
				chrome.runtime.sendMessage(message.message);
			});
		},
		//files: ["example.js"],
	});
}

// Retrieve the dev context from the displayed page and reload it on tab change
browser.tabs.onActivated.addListener(() => {
	initializeTab();
	loadDevContext(false);
});

browser.tabs.onUpdated.addListener(() => {
	initializeTab();
	setTimeout(() => {
		loadDevContext(false);
	}, 100);
});

// Mount Panel.torp into the dev tools
mount(document.getElementById("app")!, Panel, $state);

let interval: NodeJS.Timeout;
function setRecentTimeout() {
	if (interval) {
		clearTimeout(interval);
	}
	interval = setTimeout(() => {
		$state.boundaries.forEach((b) => (b.recent = false));
	}, 2000);
}

// Retrieves the dev context from the displayed page
function loadDevContext(highlight: boolean) {
	const script = `
if (globalThis[DEV_CONTEXT_SYMBOL]) {
	//console.log(JSON.stringify(globalThis[DEV_CONTEXT_SYMBOL], null, 2));
	globalThis[DEV_CONTEXT_SYMBOL].format();
}
`;

	// Keep expanded entries as-is
	// TODO: Maybe we should reload their details?
	let oldBounds = new Map<string, Boundary>();
	for (let b of $state.boundaries) {
		oldBounds.set(b.id, b);
	}

	browser.devtools.inspectedWindow.eval(script, function (result: any, isException) {
		if (isException) {
			$state.error = JSON.stringify(isException, null, 2);
			$state.warning = "";
			$state.boundaries.length = 0;
		} else if (!result) {
			$state.error = "";
			$state.warning = "No dev context found";
			$state.boundaries.length = 0;
		} else {
			$state.error = "";
			$state.warning = "";

			// Add some fields to the boundaries we received
			$state.boundaries = result.boundaries.map(
				(b: Boundary) =>
					({
						type: b.type,
						id: b.id,
						name: b.name,
						depth: b.depth,
						expanded: oldBounds.get(b.id)?.expanded ?? false,
						details: oldBounds.get(b.id)?.details ?? "",
						recent: oldBounds.get(b.id)?.recent ?? highlight,
						onexpand: expandBoundary,
						onmark: markBoundary,
						onunmark: unmarkBoundaries,
					}) satisfies Boundary,
			);

			setRecentTimeout();
		}
	});
}

function expandBoundary(id: string) {
	let boundary = $state.boundaries.find((b) => b.id === id);
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
if (globalThis[DEV_CONTEXT_SYMBOL]) {
	globalThis[DEV_CONTEXT_SYMBOL].getDetails("${id}");
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
	let boundary = $state.boundaries.find((b) => b.id === id);
	if (!boundary) {
		$state.error = "Boundary not found: " + id;
		$state.warning = "";
		return;
	}

	const script = `
if (globalThis[DEV_CONTEXT_SYMBOL]) {
	globalThis[DEV_CONTEXT_SYMBOL].mark("${id}");
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
if (globalThis[DEV_CONTEXT_SYMBOL]) {
	globalThis[DEV_CONTEXT_SYMBOL].unmark();
}`;

	browser.devtools.inspectedWindow.eval(script, function (result: any, isException) {
		if (isException) {
			$state.error = JSON.stringify(isException, null, 2);
			$state.warning = "";
		}
	});
}

browser.runtime.onMessage.addListener((text: string, _sender, _sendResponse) => {
	const message = JSON.parse(text);
	if (message.name === "REFRESH") {
		loadDevContext(true);
	} else if (message.name === "Effect run") {
		const boundary = $state.boundaries.find((b) => b.id === message.id);
		if (boundary !== undefined) {
			boundary.recent = true;
			setRecentTimeout();
			$state.events.push(`${message.name}: ${boundary.name}`);
		}
	} else if (message.name === "Signal set") {
		const boundary = $state.boundaries.find((b) => b.id === message.id);
		if (boundary !== undefined) {
			boundary.recent = true;
			setRecentTimeout();
			$state.events.push(`${message.name}: ${message.key} in ${boundary.name}`);
		}
	}
});
