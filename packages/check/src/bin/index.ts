#! /usr/bin/env node
import chalk from "chalk";
import fs from "node:fs";
import path from "node:path";
import check from "../check";
import checkFile from "../checkFile";
import printErrors from "../printErrors";
import type Diagnostic from "../types/Diagnostic";

let errors: Diagnostic[] = [];

let pathArg = process.argv[2];
if (!pathArg) {
	pathArg = process.cwd();
	errors = check(pathArg);
} else {
	if (!fs.existsSync(pathArg)) {
		pathArg = path.join(process.cwd(), pathArg);
	}
	if (!fs.existsSync(pathArg)) {
		console.log("Path not found", process.argv[2]);
	} else if (fs.lstatSync(pathArg).isDirectory()) {
		errors = check(pathArg);
	} else {
		errors = checkFile(pathArg);
	}
}

if (errors.length > 0) {
	console.log();
	printErrors(path.dirname(pathArg), errors);
	console.log(`Found ${chalk.red(errors.length)} error${errors.length === 1 ? "" : "s"}`);
} else {
	console.log("No errors found");
}
