import { buildType, parse } from "@torpor/view/compile";
import chalk from "chalk";
import { existsSync, promises as fs, lstatSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// HACK: There is almost certainly a way to do this with standard TS/TSUP/etc
// but I can't figure it out

async function run() {
	const scriptsFolder = dirname(fileURLToPath(import.meta.url));
	const sourceFolder = resolve(scriptsFolder, "../src");
	const distFolder = resolve(scriptsFolder, "../dist");

	// Wait for the types to be generated, then wait another 500ms, because
	// otherwise the types WE generate get deleted
	await waitUntilFileExists(join(distFolder, "index.d.ts"));
	await new Promise((resolve, _reject) => setTimeout(() => resolve(true), 500));

	// Read the dist files first, not for every component
	const distFiles = (await fs.readdir(distFolder)).filter((f) => f.endsWith(".torp"));

	// Loop through component folders e.g. Accordion
	const componentFolders = (await fs.readdir(distFolder)).filter((f) =>
		lstatSync(join(distFolder, f)).isDirectory(),
	);
	for (const component of componentFolders) {
		// If it's an old folder, delete it
		if (!existsSync(join(sourceFolder, component))) {
			await fs.rmdir(join(distFolder, component));
			continue;
		}

		console.log(chalk.cyan.inverse(" POST "), `Tidy ${component}`);

		// Loop through files and change declarations to imports so they get
		// processed by bundlers
		let indexFiles = await fs.readdir(join(distFolder, component));
		for (const file of indexFiles) {
			let jsfile = join(distFolder, component, file);
			let code = await fs.readFile(jsfile, "utf8");
			code = code.replace(/var (.+?) = "\.\.\/(.+?)-(.+?).torp"/g, 'import $1 from "./$2.torp"');
			await fs.writeFile(jsfile, code);
		}

		// Move all *.torp files for the component into this folder
		// And while we're at it, create type definitions
		let typeDefs: string[] = [];
		let relatedFiles = (await fs.readdir(join(sourceFolder, component)))
			.filter((f) => f.endsWith(".torp") && f !== component)
			.map((f) => basename(f, ".torp"))
			.map((f) => {
				const output = distFiles.find((df) => df.startsWith(`${f}-`) && df.endsWith(".torp"));
				if (!output) {
					console.log("FILE NOT FOUND:", f, distFiles);
				}
				return output!;
			});
		for (let file of relatedFiles) {
			const newFileName = file.substring(0, file.indexOf("-")) + ".torp";
			const newFilePath = join(distFolder, component, newFileName);
			await fs.rename(join(distFolder, file), newFilePath);

			const parsed = parse(await fs.readFile(newFilePath, "utf8"));
			if (parsed.template) {
				typeDefs.push(buildType(parsed.template));
			} else {
				console.log(chalk.magenta.inverse(" ERR! "), `  in ${newFileName}`);
			}
		}

		// Move all *.ts files into this folder
		const srcFolder = resolve(distFolder, "..", "src", component);
		const tsFiles = (await fs.readdir(srcFolder)).filter(
			(f) => f.endsWith(".ts") && f !== "index.ts",
		);
		for (const file of tsFiles) {
			await fs.copyFile(join(srcFolder, file), join(distFolder, component, file));
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
		dts += `export { ${exportNames.join(", ")} };`;
		await fs.writeFile(join(distFolder, component, "index.d.ts"), dts);
	}

	// Move all `utils` and `mount` TS files into the dest folder
	await moveUtils(distFolder, "utils");
	await moveUtils(distFolder, "mount");

	// HACK: Move index.d.ts into the motion folder. This works because it's the
	// only d.ts file we create (for now...?)
	await fs.copyFile(join(distFolder, "index.d.ts"), join(distFolder, "motion", "index.d.ts"));
}

async function moveUtils(distFolder: string, folderName: string) {
	// Move all utils/*.ts files into the dest folder
	if (!existsSync(join(distFolder, folderName))) {
		await fs.mkdir(join(distFolder, folderName));
	}

	const utilsFolder = resolve(distFolder, "..", "src", folderName);
	const utilsFiles = (await fs.readdir(utilsFolder)).filter(
		(f) => f.endsWith(".ts") && f !== "index.ts",
	);
	for (const file of utilsFiles) {
		await fs.copyFile(join(utilsFolder, file), join(distFolder, folderName, file));
	}
}

// From https://stackoverflow.com/a/62339353
async function waitUntilFileExists(filePath: string, currentTime = 0, timeout = 5000) {
	if (existsSync(filePath)) return true;
	if (currentTime === timeout) return false;
	const interval = 500;
	await new Promise((resolve, _reject) => setTimeout(() => resolve(true), interval));
	return waitUntilFileExists(filePath, currentTime + interval, timeout);
}

await run();
