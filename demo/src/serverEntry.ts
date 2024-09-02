import { eventHandler } from "vinxi/http";
import { getManifest } from "vinxi/manifest";
import type ServerComponent from "../../view/src/compile/types/ServerComponent";
import appHtml from "./app.html?raw";

export default eventHandler(async (event) => {
	console.log("handling server request for", event.node.req.url?.toLocaleLowerCase());

	// TODO: Router here from routes
	// TODO: Get the component and put it in the slot
	let view: ServerComponent | null = null;
	switch (event.node.req.url?.toLocaleLowerCase()) {
		case "/": {
			let component = await import("../client/Index.tera");
			view = component.default;
			break;
		}
		case "/party": {
			let component = await import("../client/Party.tera");
			view = component.default;
			break;
		}
	}

	if (!view) {
		// TODO: 404
		return;
	}

	// HACK: wrangle the view into app.html
	// We could instead have an App.tera component with a slot, but you can run
	// into hydration problems that way e.g. if there is a browser plugin that
	// injects elements into the <head> or <body>
	let contentStart = regexIndexOf(appHtml, /\<div\s+id=("app"|'app'|app)\s+/);
	contentStart = appHtml.indexOf(">", contentStart) + 1;
	let contentEnd = appHtml.indexOf("</div>", contentStart);
	if (contentStart === -1 || contentEnd === -1) {
		// TODO: 500
		return;
	}

	// Build client scripts
	const clientManifest = getManifest("client");
	const clientHandler = clientManifest.inputs[clientManifest.handler];
	const clientScript = clientHandler.output.path;
	const hasClientScript = !!clientScript;
	const manifestJson = JSON.stringify(clientManifest.json());
	const hasManifestJson = manifestJson !== "{}";

	// Maybe from params??
	let $props: Record<string, any> = {};

	// Put it all together
	let html =
		appHtml.substring(0, contentStart) +
		view.render($props) +
		appHtml.substring(contentEnd) +
		(hasClientScript ? `<script type="module" src="${clientScript}"></script>` : "") +
		(hasManifestJson ? `<script>window.manifest = ${manifestJson}</script>` : "");

	event.node.res.setHeader("Content-Type", "text/html");

	return html;
});

// From https://stackoverflow.com/a/274094
function regexIndexOf(string: string, regex: RegExp, position?: number) {
	var indexOf = string.substring(position || 0).search(regex);
	return indexOf >= 0 ? indexOf + (position || 0) : indexOf;
}
