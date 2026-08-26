import { buildType, parse } from "@torpor/view/compile";
import chalk from "chalk";
import { existsSync, promises as fs } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// HACK: There is almost certainly a way to do this with standard TS/tsdown/etc
// but I can't figure it out

async function run() {
	const scriptsFolder = fileURLToPath(new URL(".", import.meta.url));
	const sourceFolder = resolve(scriptsFolder, "../src");
	const distFolder = resolve(scriptsFolder, "../dist");

	// Loop through the component folders that were built, e.g. Accordion
	const builtFolders = (await fs.readdir(distFolder)).filter(
		(f) => existsSync(join(distFolder, f, "index.js")) && f !== "motion",
	);
	for (const component of builtFolders) {
		const componentFolder = join(sourceFolder, component);

		// Generate type definitions from each component's templates
		let typeDefs: string[] = [];
		let torpFiles = (await fs.readdir(componentFolder)).filter((f) => f.endsWith(".torp"));
		for (let file of torpFiles) {
			const parsed = parse(await fs.readFile(join(componentFolder, file), "utf8"));
			if (parsed.template) {
				typeDefs.push(buildType(parsed.template));
			} else {
				console.log(chalk.magenta.inverse(" ERR! "), `  in ${file}`);
			}
		}

		// Create the d.ts file from the type definitions
		let dts = `import { type SlotRender } from "@torpor/view";\n`;
		let exportNames: string[] = [];
		for (let typeDef of typeDefs) {
			const match = /export default (.+?);/.exec(typeDef);
			if (match) {
				exportNames.push(match[1]);
				typeDef = typeDef.replace(match[0], "");
			}
			typeDef = typeDef.replace(`import { type SlotRender } from "@torpor/view";`, "");
			dts += typeDef;
		}
		dts += `export { ${exportNames.join(", ")} };\n`;

		// Add re-exports for plain TS modules (e.g. showModal, showNotification)
		// that the component's index.ts exports but which don't come from .torp
		// files, so that they keep their types for consumers
		const indexSource = await fs.readFile(join(componentFolder, "index.ts"), "utf8");
		const allExports = [...indexSource.matchAll(/export \{([^}]+)\}/g)]
			.flatMap((m) => m[1].split(","))
			.map((n) =>
				n
					.trim()
					.split(/\s+as\s+/)
					.pop()!,
			)
			.filter((n) => n && !exportNames.includes(n));
		const tsFiles = (await fs.readdir(componentFolder)).filter(
			(f) => f.endsWith(".ts") && f !== "index.ts",
		);
		for (const name of allExports) {
			if (tsFiles.includes(`${name}.ts`)) {
				dts += `export { default as ${name} } from "./${name}";\n`;
			}
		}

		await fs.writeFile(join(distFolder, component, "index.d.ts"), dts);

		// Copy all *.ts files (except index.ts) into the dist folder, so that
		// imports from the .torp files resolve for consumers
		console.log(chalk.cyan.inverse(" POST "), `Tidy ${component}`);
		for (const file of tsFiles) {
			await fs.copyFile(join(componentFolder, file), join(distFolder, component, file));
		}
	}

	// Copy all `utils` and `mount` TS files into the dist folder, so that
	// imports from the .torp files resolve for consumers
	await moveUtils(distFolder, sourceFolder, "utils");
	await moveUtils(distFolder, sourceFolder, "mount");
}

async function moveUtils(distFolder: string, sourceFolder: string, folderName: string) {
	const utilsFolder = join(sourceFolder, folderName);
	const utilsFiles = (await fs.readdir(utilsFolder)).filter(
		(f) => f.endsWith(".ts") && f !== "index.ts",
	);
	await fs.mkdir(join(distFolder, folderName), { recursive: true });
	for (const file of utilsFiles) {
		await fs.copyFile(join(utilsFolder, file), join(distFolder, folderName, file));
	}
}

await run();
