import chalk from "chalk";
import fg from "fast-glob";
import { existsSync, promises as fs } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

async function run() {
	const folder = resolve(dirname(fileURLToPath(import.meta.url)), "../dist");
	const files = await fg("*.tera", {
		ignore: ["chunk-*"],
		absolute: true,
		cwd: folder,
	});
	for (const file of files) {
		const filename = basename(file);
		console.log(chalk.cyan.inverse(" POST "), `Fix ${filename}`);

		let code = await fs.readFile(file, "utf8");
		code = code.replace("../utils/getId", "./getId");
		await fs.writeFile(file, code);

		const newfilename = filename.substring(0, filename.indexOf("-")) + ".tera";
		await fs.rename(file, join(folder, newfilename));

		const jsfilename = newfilename.replace(".tera", ".js");
		const jsfile = join(folder, jsfilename);
		console.log(chalk.cyan.inverse(" POST "), `Fix ${filename}`);
		if (existsSync(jsfile)) {
			let code = await fs.readFile(jsfile, "utf8");
			code = code.replace(/var (.+?) = "\.\/(.+?)-(.+?).tera"/g, 'import $1 from "./$2.tera"');
			await fs.writeFile(jsfile, code);
		}

		// TODO: Just all .ts files
		const name = newfilename.replace(".tera", "");
		const typesfile = join(resolve(folder, "..", "src", name), name + "Types.ts");
		if (existsSync(typesfile)) {
			const newtypesfile = join(folder, name + "Types.ts");
			fs.copyFile(typesfile, newtypesfile);
		}

		// TODO: Same here
		fs.copyFile(join(resolve(folder, "..", "src", "utils"), "getId.ts"), join(folder, "getId.ts"));
	}
}

run();
