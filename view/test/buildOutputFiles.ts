import fg from "fast-glob";
import { existsSync, promises as fs } from "node:fs";
import path from "node:path";
import { buildType } from "../src/compile";
import build from "../src/compile/build";
import parse from "../src/compile/parse";

export default async function buildOutputFiles(componentPath: string) {
	//console.log("Building test output files", componentPath);
	const files = await fg("**/*.tera", {
		absolute: true,
		cwd: path.resolve(path.dirname(componentPath)),
	});
	await Promise.all(files.sort().map((f) => buildFiles(f)));
	//console.log("Done\n");
}

async function buildFiles(file: string) {
	//console.log(`Building files for ${file.substring(path.resolve("./test").length)}`);

	const name = path.basename(file, ".tera");
	const source = await fs.readFile(file, "utf8");
	const parsed = parse(source);
	if (parsed.ok && parsed.template) {
		let serverCode = formatCode(build(parsed.template, { server: true }).code, "server");
		let clientCode = formatCode(build(parsed.template).code, "client");

		let typesCode = buildType(name, parsed.template);
		await fs.writeFile(file.replace(".tera", ".d.ts"), typesCode);

		let outputFile = file.replace("/components/", "/components/output/");
		if (!existsSync(path.dirname(outputFile))) {
			await fs.mkdir(path.dirname(outputFile));
		}
		await fs.writeFile(outputFile.replace(".tera", "-server.ts"), serverCode);
		await fs.writeFile(outputFile.replace(".tera", "-client.ts"), clientCode);
	} else {
		// Just log the message and continue with output/testing
		console.log("Parse failed for " + file);
	}
}

function formatCode(code: string, suffix: string): string {
	// Replace imports from the built @tera/view to the source code, so that
	// a) we don't have to build @tera/view before testing, and
	// b) we have access to the same global context object in test and component code
	for (let imp in importsMap) {
		code = code.replace(imp, importsMap[imp]);
	}

	// Replace component imports with JS imports
	code = code.replaceAll(/import (.+?) from ['"](.+?).tera['"]/g, `import $1 from "$2-${suffix}"`);

	return code;
}

// HACK: We could probably be smarter about this
const importsMap: Record<string, string> = {
	'import { $watch } from "@tera/view";': 'import $watch from "../../../../src/render/$watch";',
	'import { $unwrap } from "@tera/view";': 'import $unwrap from "../../../../src/render/$unwrap";',
	'import { $run } from "@tera/view";': 'import $run from "../../../../src/render/$run";',
	'import { $mount } from "@tera/view";': 'import $mount from "../../../../src/render/$mount";',
	'import { t_flush } from "@tera/view";':
		'import t_flush from "../../../../src/render/flushMountEffects";',
	'import { t_range } from "@tera/view";': 'import t_range from "../../../../src/render/newRange";',
	'import { t_push_range } from "@tera/view";':
		'import t_push_range from "../../../../src/render/pushRange";',
	'import { t_pop_range } from "@tera/view";':
		'import t_pop_range from "../../../../src/render/popRange";',
	'import { t_run_control } from "@tera/view";':
		'import t_run_control from "../../../../src/render/runControl";',
	'import { t_run_branch } from "@tera/view";':
		'import t_run_branch from "../../../../src/render/runControlBranch";',
	'import { t_list_item } from "@tera/view";':
		'import t_list_item from "../../../../src/render/newListItem";',
	'import { t_run_list } from "@tera/view";':
		'import t_run_list from "../../../../src/render/runList";',
	'import { t_add_fragment } from "@tera/view";':
		'import t_add_fragment from "../../../../src/render/addFragment";',
	'import { t_apply_props } from "@tera/view";':
		'import t_apply_props from "../../../../src/render/applyProps";',
	'import { t_attribute } from "@tera/view";':
		'import t_attribute from "../../../../src/render/setAttribute";',
	'import { t_dynamic } from "@tera/view";':
		'import t_dynamic from "../../../../src/render/setDynamicElement";',
	'import { t_fmt } from "@tera/view";': 'import t_fmt from "../../../../src/render/formatText";',
	'import { t_fragment } from "@tera/view";':
		'import t_fragment from "../../../../src/render/getFragment";',
	'import { t_event } from "@tera/view";': 'import t_event from "../../../../src/render/addEvent";',
	'import { t_animate } from "@tera/view";':
		'import t_animate from "../../../../src/render/addAnimation";',
	'import { t_root } from "@tera/view";': 'import t_root from "../../../../src/render/nodeRoot";',
	'import { t_anchor } from "@tera/view";':
		'import t_anchor from "../../../../src/render/nodeAnchor";',
	'import { t_child } from "@tera/view";':
		'import t_child from "../../../../src/render/nodeChild";',
	'import { t_next } from "@tera/view";': 'import t_next from "../../../../src/render/nodeNext";',
	'import { t_frg } from "@tera/view";':
		'import t_frg from "../../../../src/render/createFragment";',
	'import { t_elm } from "@tera/view";':
		'import t_elm from "../../../../src/render/createElement";',
	'import { t_txt } from "@tera/view";': 'import t_txt from "../../../../src/render/createText";',
	'import { t_cmt } from "@tera/view";':
		'import t_cmt from "../../../../src/render/createComment";',
	'import type { ListItem } from "@tera/view";':
		'import type ListItem from "../../../../src/types/ListItem";',
	'import type { SlotRender } from "@tera/view";':
		'import type SlotRender from "../../../../src/types/SlotRender";',
	'import { t_attr } from "@tera/view/ssr";':
		'import t_attr from "../../../../src/render/formatAttributeText";',
	'import type { ServerSlotRender } from "@tera/view/ssr";':
		'import type ServerSlotRender from "../../../../src/types/ServerSlotRender";',
};
