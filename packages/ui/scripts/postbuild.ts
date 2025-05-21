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

	// Read the dist files first, not for every component
	const distFiles = (await fs.readdir(distFolder)).filter((f) => f.endsWith(".torp"));

	// Loop through component folders e.g. Accordion
	const componentFolders = (await fs.readdir(distFolder)).filter((f) =>
		lstatSync(join(distFolder, f)).isDirectory(),
	);
	for (const component of componentFolders) {
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
			const newfile = file.substring(0, file.indexOf("-")) + ".torp";
			await fs.rename(join(distFolder, file), join(distFolder, component, newfile));
		}

		// Move all *.ts files into this folder
		const srcFolder = resolve(distFolder, "..", "src", component);
		const tsFiles = (await fs.readdir(srcFolder)).filter(
			(f) => f.endsWith(".ts") && f !== "index.ts",
		);
		for (const file of tsFiles) {
			await fs.copyFile(join(srcFolder, file), join(distFolder, component, file));
		}
	}

	// Move all utils/*.ts files into the dest folder
	moveUtils(distFolder, "utils");
	moveUtils(distFolder, "mount");
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

run();
