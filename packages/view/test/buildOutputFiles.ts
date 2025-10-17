import fg from "fast-glob";
import crypto from "node:crypto";
import { existsSync, promises as fs, unlinkSync } from "node:fs";
import path from "node:path";
import build from "../src/compile/build";
import buildType from "../src/compile/buildType";
import parse from "../src/compile/parse";

export default async function buildOutputFiles(componentPath: string): Promise<void> {
	//console.log("Building test output files", componentPath);
	const files = await fg("**/*.torp", {
		absolute: true,
		cwd: path.resolve(path.dirname(componentPath)),
	});
	await Promise.all(files.sort().map((f) => buildFiles(f)));
	//console.log("Done\n");
}

export async function buildFiles(file: string): Promise<void> {
	//console.log(`Building files for ${file.substring(path.resolve("./test").length)}`);

	const source = await fs.readFile(file, "utf8");
	const parsed = parse(source);
	if (parsed.ok && parsed.template) {
		let serverCode = formatCode(build(parsed.template, { server: true }).code, "server");
		let clientCode = formatCode(build(parsed.template).code, "client");
		//let clientMap = formatMap(source, build(parsed.template, { mapped: true }));
		let typesCode = formatCode(buildType(parsed.template), "types");
		await maybeWriteFile(file, clientCode, "client");
		await maybeWriteFile(file, serverCode, "server");
		//await maybeWriteFile(file, clientMap, "map");
		await maybeWriteFile(file, typesCode, "types");
	} else {
		// Just log the message and continue with output/testing
		console.log("PARSE FAILED for " + file);
		console.log(parsed.errors.map((e) => e.message).join("\n"));
	}
}

async function maybeWriteFile(file: string, code: string, suffix: string) {
	//const hash = await hashFileContents(code);
	const hash = hashFileCode(code);

	// If the hashed file doesn't exist, update it and the output file
	let outputFile = file
		.replace("/components/", "/components/temp/")
		.replace(".torp", `-${suffix}-${hash}.ts`);
	if (!existsSync(outputFile)) {
		console.log(`Building files for ${file}`);

		let outputFolder = path.dirname(outputFile);
		if (!existsSync(outputFolder)) {
			await fs.mkdir(outputFolder);
		}

		// Delete old files
		const glob = `${path.basename(file, ".torp")}-${suffix}-*.ts`;
		const oldFiles = await fg(glob, {
			absolute: true,
			cwd: path.resolve(outputFolder),
		});
		oldFiles.forEach((f) => {
			if (existsSync(f)) {
				unlinkSync(f);
			}
		});

		// Create the new hash file
		await fs.writeFile(outputFile, code);

		// Create the new output file
		outputFile = file
			.replace("/components/", "/components/output/")
			.replace(".torp", `-${suffix}.ts`);
		if (!existsSync(path.dirname(outputFile))) {
			await fs.mkdir(path.dirname(outputFile));
		}
		await fs.writeFile(outputFile, code);
	}
}

function hashFileCode(code: string) {
	return crypto.createHash("sha1").update(code).digest("hex");
}

function formatCode(code: string, suffix: string): string {
	// Replace imports from the built @torpor/view to the source code, so that
	// a) we don't have to build @torpor/view before testing, and
	// b) we have access to the same global context object in test and component code
	for (let imp in importsMap) {
		code = code.replace(imp, importsMap[imp]);
	}

	// Replace component imports with JS imports
	// HACK: Reference from `../output/` as it will work in both the hashed files
	// (in `/temp`) and non-hashed files (in `/output`)
	code = code.replaceAll(
		/import (.+?) from ['"](.+?).torp['"]/g,
		`import $1 from "../output/$2-${suffix}"`,
	);

	return code;
}

/*
function formatMap(source: string, result: BuildResult) {
	let code = "";

	for (let mapped of result.map) {
		let from = source.substring(mapped.source.start, mapped.source.end);
		let to = result.code.substring(mapped.compiled.start, mapped.compiled.end);
		if (from !== to) {
			code += from + "\n";
			code += ".\n";
			code += to + "\n";
			code += "-----\n";
		}
	}

	return code;
}
*/

// HACK: We could probably be smarter about this
const importsMap: Record<string, string> = {
	'import { $watch } from "@torpor/view";': 'import $watch from "../../../../src/watch/$watch";',
	'import { $cache } from "@torpor/view";': 'import $cache from "../../../../src/watch/$cache";',
	'import { $run } from "@torpor/view";': 'import $run from "../../../../src/watch/$run";',
	'import { $mount } from "@torpor/view";': 'import $mount from "../../../../src/watch/$mount";',
	'import { $unwrap } from "@torpor/view";': 'import $unwrap from "../../../../src/watch/$unwrap";',
	'import { $peek } from "@torpor/view";': 'import $peek from "../../../../src/watch/$peek";',
	'import { $batch } from "@torpor/view";': 'import $batch from "../../../../src/watch/$batch";',
	'import { t_range } from "@torpor/view";':
		'import t_range from "../../../../src/render/newRange";',
	'import { t_push_range } from "@torpor/view";':
		'import t_push_range from "../../../../src/render/pushRange";',
	'import { t_pop_range } from "@torpor/view";':
		'import t_pop_range from "../../../../src/render/popRange";',
	'import { t_run_control } from "@torpor/view";':
		'import t_run_control from "../../../../src/render/runControl";',
	'import { t_run_branch } from "@torpor/view";':
		'import t_run_branch from "../../../../src/render/runControlBranch";',
	'import { t_list_item } from "@torpor/view";':
		'import t_list_item from "../../../../src/render/newListItem";',
	'import { t_run_list } from "@torpor/view";':
		'import t_run_list from "../../../../src/render/runList";',
	'import { t_add_fragment } from "@torpor/view";':
		'import t_add_fragment from "../../../../src/render/addFragment";',
	'import { t_apply_props } from "@torpor/view";':
		'import t_apply_props from "../../../../src/render/applyProps";',
	'import { t_attribute } from "@torpor/view";':
		'import t_attribute from "../../../../src/render/setAttribute";',
	'import { t_class } from "@torpor/view";':
		'import t_class from "../../../../src/render/buildClasses";',
	'import { t_style } from "@torpor/view";':
		'import t_style from "../../../../src/render/buildStyles";',
	'import { t_dynamic } from "@torpor/view";':
		'import t_dynamic from "../../../../src/render/setDynamicElement";',
	'import { t_fmt } from "@torpor/view";': 'import t_fmt from "../../../../src/render/formatText";',
	'import { t_fragment } from "@torpor/view";':
		'import t_fragment from "../../../../src/render/getFragment";',
	'import { t_event } from "@torpor/view";':
		'import t_event from "../../../../src/render/addEvent";',
	'import { t_animate } from "@torpor/view";':
		'import t_animate from "../../../../src/render/addAnimation";',
	'import { t_root } from "@torpor/view";': 'import t_root from "../../../../src/render/nodeRoot";',
	'import { t_anchor } from "@torpor/view";':
		'import t_anchor from "../../../../src/render/nodeAnchor";',
	'import { t_child } from "@torpor/view";':
		'import t_child from "../../../../src/render/nodeChild";',
	'import { t_next } from "@torpor/view";': 'import t_next from "../../../../src/render/nodeNext";',
	'import { t_skip } from "@torpor/view";': 'import t_skip from "../../../../src/render/nodeSkip";',
	'import { t_frg } from "@torpor/view";':
		'import t_frg from "../../../../src/render/createFragment";',
	'import { t_elm } from "@torpor/view";':
		'import t_elm from "../../../../src/render/createElement";',
	'import { t_txt } from "@torpor/view";': 'import t_txt from "../../../../src/render/createText";',
	'import { t_cmt } from "@torpor/view";':
		'import t_cmt from "../../../../src/render/createComment";',
	'import { type ListItem } from "@torpor/view";':
		'import type ListItem from "../../../../src/types/ListItem";',
	'import { type SlotRender } from "@torpor/view";':
		'import type SlotRender from "../../../../src/types/SlotRender";',
	'import { $watch } from "@torpor/view/ssr";':
		'import $watch from "../../../../src/ssr/$serverWatch";',
	'import { $cache } from "@torpor/view/ssr";':
		'import $cache from "../../../../src/ssr/$serverCache";',
	'import { $run } from "@torpor/view/ssr";': 'import $run from "../../../../src/ssr/$serverRun";',
	'import { $mount } from "@torpor/view/ssr";':
		'import $mount from "../../../../src/ssr/$serverMount";',
	'import { $unwrap } from "@torpor/view/ssr";':
		'import $unwrap from "../../../../src/ssr/$serverUnwrap";',
	'import { $peek } from "@torpor/view/ssr";':
		'import $peek from "../../../../src/ssr/$serverPeek";',
	'import { $batch } from "@torpor/view/ssr";':
		'import $batch from "../../../../src/ssr/$serverBatch";',
	'import { t_fmt } from "@torpor/view/ssr";':
		'import t_fmt from "../../../../src/render/formatText";',
	'import { t_attr } from "@torpor/view/ssr";':
		'import t_attr from "../../../../src/render/formatAttributeText";',
	'import { t_class } from "@torpor/view/ssr";':
		'import t_class from "../../../../src/render/buildClasses";',
	'import { t_style } from "@torpor/view/ssr";':
		'import t_style from "../../../../src/render/buildStyles";',
	'import { t_print } from "@torpor/view";':
		'import t_print from "../../../../src/debug/printNode";',
	'import { type ServerSlotRender } from "@torpor/view/ssr";':
		'import type ServerSlotRender from "../../../../src/types/ServerSlotRender";',
};
