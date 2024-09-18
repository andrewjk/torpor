import chalk from "chalk";
import { existsSync, promises as fs, lstatSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// HACK: There is almost certainly a way to do this with standard TS/TSUP/etc
// but I can't figure it out

async function run() {
	const distFolder = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");

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
			code = code.replace(/var (.+?) = "\.\.\/(.+?)-(.+?).tera"/g, 'import $1 from "./$2.tera"');
			await fs.writeFile(jsfile, code);
		}

		// Move all *.tera files for the component into this folder
		const relatedFiles = (await fs.readdir(distFolder)).filter(
			(f) => f.startsWith(component) && f !== component,
		);
		for (const file of relatedFiles) {
			const newfile = file.substring(0, file.indexOf("-")) + ".tera";
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
	if (!existsSync(join(distFolder, "utils"))) {
		await fs.mkdir(join(distFolder, "utils"));
	}

	const utilsFolder = resolve(distFolder, "..", "src", "utils");
	const utilsFiles = (await fs.readdir(utilsFolder)).filter(
		(f) => f.endsWith(".ts") && f !== "index.ts",
	);
	for (const file of utilsFiles) {
		await fs.copyFile(join(utilsFolder, file), join(distFolder, "utils", file));
	}
}

run();
