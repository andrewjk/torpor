import chalk from "chalk";
import path from "node:path";
import type Diagnostic from "./types/Diagnostic";

export default function printErrors(folder: string, errors: Diagnostic[]): void {
	errors.sort((a, b) => a.path.localeCompare(b.path));

	for (let error of errors) {
		console.log(
			`${chalk.green(path.relative(folder, error.path))}:${chalk.yellow(error.range.start.line)}:${chalk.yellow(error.range.start.character)} - ${chalk.red("error")}${error.code ? chalk.gray(` TS${error.code}`) : ""}: ${error.message}`,
		);
		if (error.lineText) {
			// HACK: If I were less lazy I'd replace tabs with 4 spaces and adjust positions
			error.lineText = error.lineText.replaceAll("\t", " ");
			console.log(`${chalk.black.bgWhite(error.range.start.line)} ${error.lineText}`);
			let numberLength = error.range.start.line.toString().length;
			let spacerLength = error.range.start.character;
			let squiggleLength =
				error.range.start.line === error.range.end.line
					? error.range.end.character - error.range.start.character
					: error.lineText.length - error.range.start.character;
			console.log(
				`${chalk.black.bgWhite(" ".repeat(numberLength))} ${" ".repeat(spacerLength)}${chalk.red("~").repeat(squiggleLength)}`,
			);
		}
		console.log();
	}
}
