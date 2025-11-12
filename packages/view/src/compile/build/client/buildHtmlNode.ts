import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import addMappedText from "./addMappedText";
import buildAddFragment from "./buildAddFragment";
import replaceForVarNames from "./replaceForVarNames";

// TODO: type checking

export default function buildHtmlNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	const htmlAnchorName = node.varName!;
	const htmlParentName = node.parentName || htmlAnchorName + ".parentNode";
	const htmlRegionName = nextVarName("html_region", status);

	// HACK: I'm not actually sure we need this here (or in @replace, where I copied it from)
	node = node.children[0] as ControlNode;

	status.imports.add("t_region");
	status.imports.add("t_run_control");
	status.imports.add("t_run_branch");
	status.imports.add("t_push_region");
	status.imports.add("t_pop_region");

	b.append("");
	b.append(`
	/* @html */
	const ${htmlRegionName} = t_region(${status.options.dev === true ? `"html"` : ""});
	t_run_control(${htmlRegionName}, ${htmlAnchorName}, (t_before) => {`);

	buildHtmlBranch(node, status, b, htmlParentName, htmlRegionName);

	b.append(`}${status.options.dev === true ? ', "html"' : ""});`);
	b.append("");
}

function buildHtmlBranch(
	node: ControlNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	regionName: string,
) {
	status.imports.add("t_run_branch");

	b.append(`${replaceForVarNames(node.statement, status)};`);
	b.append(`if (!t_run_branch(${regionName}, 0, -1)) return;`);

	b.append(`
		const t_new_region = t_region(${status.options.dev === true ? `"html_branch"` : ""});
		const t_old_region = t_push_region(t_new_region, true);
	`);

	const templateName = nextVarName("template", status);
	const fragmentName = `t_fragment_${node.fragment!.number}`;
	b.append(`let ${templateName} = document.createElement("template");`);
	// TODO: replaceForVarNames is going to throw mapping out
	node.span.start += "html(".length;
	node.span.end -= 2;
	addMappedText(
		"",
		`${templateName}.innerHTML = ${replaceForVarNames(node.statement, status)};`,
		"",
		node.span,
		status,
		b,
	);
	b.append(`let ${fragmentName} = ${templateName}.content.cloneNode(true) as DocumentFragment;`);

	buildAddFragment(node, status, b, parentName, "t_before");

	b.append("t_pop_region(t_old_region);");
}
