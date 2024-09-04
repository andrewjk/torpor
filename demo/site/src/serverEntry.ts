import fs from "fs";
import path from "path";
import { eventHandler } from "vinxi/http";
import { getManifest } from "vinxi/manifest";
//import appHtml from "../../demo/src/app.html?raw";
import dirName from "./dirName";
import routeHandlers from "./routeHandlers";
import type RouteHandler from "./types/RouteHandler";

export default eventHandler(async (event) => {
	console.log("handling server request for", event.path);

	const route = routeHandlers.find((route) => route.path === event.path);
	const handler: RouteHandler | undefined = await route?.handler;

	if (!handler?.view) {
		// TODO: 404
		return;
	}

	const view = handler.view();

	// HACK: wrangle the view into app.html
	// We could instead have an App.tera component with a slot, but you can run
	// into hydration problems that way e.g. if there is a browser plugin that
	// injects elements into <head> or <body>
	const appHtml = loadAppHtml();
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

let loadedAppHtml = "";
function loadAppHtml() {
	if (!loadedAppHtml) {
		let file = path.join(dirName(), "..", "../", "src", "app.html");
		loadedAppHtml = fs.readFileSync(file).toString();
	}
	return loadedAppHtml;
}

// From https://stackoverflow.com/a/274094
function regexIndexOf(string: string, regex: RegExp, position?: number) {
	var indexOf = string.substring(position || 0).search(regex);
	return indexOf >= 0 ? indexOf + (position || 0) : indexOf;
}
