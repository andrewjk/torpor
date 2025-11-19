import { type UserConfig, defineConfig } from "tsdown";

export default defineConfig({
	entry: [
		"src/index.ts",
		"src/nav.ts",
		"src/response.ts",
		"src/run.ts",
		"src/server.ts",
		"src/state.ts",
		"src/test.ts",
		"src/bin/index.ts",
		// TODO: Compile these so we don't have to include the entire src folder in the build
		//"src/site/clientEntry.ts",
		//"src/site/clientEntryDev.ts",
		//"src/site/serverEntry.ts",
	],
	// Put this in here to stop issues with bundling Vite from bin/index.ts
	// I'm not sure if this will cause further issues down the line?
	external: ["vite"],
	onSuccess: "npm run build:fix",
}) satisfies UserConfig as UserConfig;
