import { expect, test } from "vite-plus/test";
import { unpluginFactory } from "../src/index";

function configHook(): (config: any) => void {
	const plugin = unpluginFactory({}, { framework: "vite", versions: {} }) as any;
	return plugin.vite.config;
}

test("inlines @torpor/view for SSR so the server-runtime rewrite can run", () => {
	const config: any = {};
	configHook()(config);
	expect(config.ssr.noExternal).toEqual(["@torpor/view"]);
});

test("merges @torpor/view into an existing ssr.noExternal list", () => {
	const config: any = { ssr: { noExternal: ["@torpor/ui"] } };
	configHook()(config);
	expect(config.ssr.noExternal).toEqual(["@torpor/ui", "@torpor/view"]);
});

test("wraps a single string ssr.noExternal", () => {
	const config: any = { ssr: { noExternal: "foo" } };
	configHook()(config);
	expect(config.ssr.noExternal).toEqual(["foo", "@torpor/view"]);
});

test("leaves ssr.noExternal: true alone", () => {
	const config: any = { ssr: { noExternal: true } };
	configHook()(config);
	expect(config.ssr.noExternal).toBe(true);
});
