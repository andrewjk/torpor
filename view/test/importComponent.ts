import fg from "fast-glob";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export default async function importComponent(componentPath: string, suffix: string) {
	// Create a file with a hashed suffix to import dynamically in Vite(st)
	const sourceFile =
		path.join(path.dirname(componentPath), "output", path.basename(componentPath)) +
		`-${suffix}.ts`;
	const hash = await hashFileContents(sourceFile);
	const destPath = path.join(path.dirname(componentPath), "temp");
	const destFile = path.join(destPath, `${path.basename(componentPath)}-${suffix}-${hash}.ts`);
	if (!fs.existsSync(destFile)) {
		console.log(`${sourceFile} has changed, copying new version`);

		if (!fs.existsSync(destPath)) {
			fs.mkdirSync(destPath);
		}

		// Delete old files
		(
			await fg(`${path.basename(componentPath)}-${suffix}-*.ts`, {
				absolute: true,
				cwd: path.resolve(destPath),
			})
		).forEach((f) => fs.unlinkSync(f));

		//fs.copyFileSync(sourceFile, destFile);
		const source = fs
			.readFileSync(sourceFile, "utf8")
			.replaceAll(/import (.+?) from ['"]\.\/(.+?)['"]/g, 'import $1 from "../output/$2"');
		fs.writeFileSync(destFile, source);
	}
	return (await import(destFile)).default as any;
}

// From https://stackoverflow.com/a/18658613
function hashFileContents(path: string): Promise<string> {
	return new Promise((resolve, reject) => {
		const hash = crypto.createHash("sha1");
		const stream = fs.createReadStream(path);
		stream.on("error", (err) => reject(err));
		stream.on("data", (chunk) => hash.update(chunk));
		stream.on("end", () => resolve(hash.digest("hex")));
	});
}
