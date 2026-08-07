import { type ViteUserConfigFnObject, defineConfig } from "vite-plus";

export default defineConfig(() => ({
	test: {
		projects: ["packages/*", "packages/adapters/*", "examples/*"],
	},
})) satisfies ViteUserConfigFnObject as ViteUserConfigFnObject;
