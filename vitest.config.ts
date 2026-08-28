import { type ViteUserConfigFnObject, defineConfig } from "vite-plus";

export default defineConfig(() => ({
	test: {
		projects: ["packages/*", "packages/adapters/*", "language-tools", "examples/*"],
	},
})) satisfies ViteUserConfigFnObject as ViteUserConfigFnObject;
