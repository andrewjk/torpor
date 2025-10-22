import { $watch, mount } from "@torpor/view";
import { browser } from "wxt/browser";
import Panel from "./Panel.torp";

let $state = $watch({
	warning: "",
	error: "",
	data: {
		boundaries: [],
		reload: loadDevContext,
	},
});

loadDevContext();
browser.tabs.onActivated.addListener(() => loadDevContext);

mount(document.getElementById("app")!, Panel, $state);

function loadDevContext() {
	const script = `
if (globalThis.T_DEV_CTX) {
	//console.log(JSON.stringify(globalThis.T_DEV_CTX(), null, 2));
	globalThis.T_DEV_CTX();
}`;

	browser.devtools.inspectedWindow.eval(script, function (result: any, isException) {
		if (isException) {
			$state.error = JSON.stringify(isException, null, 2);
			$state.warning = "";
			$state.data.boundaries.length = 0;
		} else if (!result) {
			$state.error = "";
			$state.warning = "No dev info found";
			$state.data.boundaries.length = 0;
		} else {
			$state.error = "";
			$state.warning = "";
			$state.data.boundaries = result.boundaries;
		}
	});
}
