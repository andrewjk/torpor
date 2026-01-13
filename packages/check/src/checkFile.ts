import fs from "node:fs";
import path from "node:path";
import type Diagnostic from "./types/Diagnostic";
import validateScript from "./validateScript";

export default function check(file: string): Diagnostic[] {
	if (!fs.existsSync(file)) {
		file = path.join(process.cwd(), file);
	}
	console.log("Checking file", file);

	return validateScript(file);
}
