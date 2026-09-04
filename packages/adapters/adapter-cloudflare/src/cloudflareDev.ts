import { cloudflare } from "@cloudflare/vite-plugin";
import { type Site } from "@torpor/build";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { type Plugin, type ViteDevServer } from "vite";
import { detectSourceMode, siteEntryPaths } from "./entryPaths";
import prepareTemplate from "./prepareTemplate";

const TEMPLATE_ID = "virtual:torpor-template";
const RESOLVED_TEMPLATE_ID = `\0${TEMPLATE_ID}`;

/**
 * Vite plugin(s) for Cloudflare dev. Delegates the workerd runtime + bindings +
 * HMR to `@cloudflare/vite-plugin` (assigning the Worker to Vite's `ssr`
 * environment, so torpor's server code runs in workerd), overriding `main` to
 * point at the adapter's dev worker, and exposing the prepared `site.html`
 * template through a virtual module (since `transformIndexHtml` has to run
 * Node-side but the template is consumed inside workerd).
 */
export default function cloudflareDev(site: Site): Plugin[] {
	let viteServer: ViteDevServer | undefined;
	let templatePromise: Promise<string | undefined> | undefined;

	const templatePlugin: Plugin = {
		name: "torpor-cloudflare-template",
		configureServer(server) {
			viteServer = server;
		},
		resolveId(id) {
			if (id === TEMPLATE_ID) return RESOLVED_TEMPLATE_ID;
		},
		async load(id) {
			if (id !== RESOLVED_TEMPLATE_ID) return;
			templatePromise ??= buildDevTemplate(viteServer!, site);
			return `export default ${JSON.stringify(await templatePromise)};`;
		},
	};

	const cfPlugins = cloudflare({
		viteEnvironment: { name: "ssr" },
		config: {
			main: "./node_modules/@torpor/adapter-cloudflare/dist/_worker.dev.ts",
		},
	});

	return [templatePlugin, ...cfPlugins];
}

async function buildDevTemplate(vite: ViteDevServer, site: Site): Promise<string | undefined> {
	// Read site.html if present. An endpoints-only site has no site.html, and
	// no template is needed
	const templateFile = path.resolve(site.root, "src/site.html");
	if (!existsSync(templateFile)) {
		return undefined;
	}
	let template = await fs.readFile(templateFile, "utf-8");
	template = await vite.transformIndexHtml("", template);

	const sourceMode = detectSourceMode(site.root);
	const entries = siteEntryPaths(site.root, sourceMode);

	// Splice component placeholders and append the production client entry
	template = prepareTemplate(template, entries.clientEntry);

	// Inject the dev client entry (for HMR) just before the client entry
	const clientTag = `<script type="module" src="${entries.clientEntry}"></script>`;
	template = template.replace(
		clientTag,
		`<script type="module" src="${entries.clientDevEntry}"></script>\n${clientTag}`,
	);

	return template;
}
