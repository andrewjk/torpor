import fs from "fs";
import path from "path";
import { eventHandler } from "vinxi/http";
import { getManifest } from "vinxi/manifest";
import type EndPoint from "../types/EndPoint";
import routeHandlers from "./routeHandlers";

export default eventHandler(async (event) => {
	const url = new URL(`http://${process.env.HOST ?? "localhost"}${event.node.req.url}`);
	const path = url.pathname;
	const urlParams = url.searchParams;

	console.log("handling server request for", path, urlParams);

	const route = routeHandlers.match(path, urlParams);
	const handler: EndPoint | undefined = (await route?.handler.handler)?.default;

	if (!handler?.view) {
		// TODO: 404
		return;
	}

	const view = handler.view({
		routeParams: route?.routeParams,
		urlParams: route?.urlParams,
	});

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

	// Pass the data into $props
	let $props: Record<string, any> = {
		data: view.data,
	};

	// Put it all together
	let html =
		appHtml.substring(0, contentStart) +
		view.component.render($props) +
		appHtml.substring(contentEnd) +
		(hasClientScript ? `<script type="module" src="${clientScript}"></script>` : "") +
		(hasManifestJson ? `<script>window.manifest = ${manifestJson}</script>` : "");

	event.node.res.setHeader("Content-Type", "text/html");

	return html;
});

let loadedAppHtml = "";
function loadAppHtml() {
	if (!loadedAppHtml) {
		let file = path.resolve("src/app.html");
		loadedAppHtml = fs.readFileSync(file).toString();
	}
	return loadedAppHtml;
}

// From https://stackoverflow.com/a/274094
function regexIndexOf(string: string, regex: RegExp, position?: number) {
	var indexOf = string.substring(position || 0).search(regex);
	return indexOf >= 0 ? indexOf + (position || 0) : indexOf;
}
