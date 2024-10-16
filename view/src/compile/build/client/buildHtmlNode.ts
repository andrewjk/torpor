import type ControlNode from "../../types/nodes/ControlNode";
import type ElementNode from "../../types/nodes/ElementNode";
import Builder from "../../utils/Builder";
import nextVarName from "../utils/nextVarName";
import BuildStatus from "./BuildStatus";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";

export default function buildHtmlNode(
	node: ControlNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	anchorName: string,
) {
	const htmlAnchorName = node.varName!;
	const htmlParentName = node.parentName || htmlAnchorName + ".parentNode";
	const htmlRangeName = nextVarName("html_range", status);

	// HACK: I'm not actually sure we need this here (or in @replace, where I copied it from)
	node = node.children[0] as ControlNode;

	status.imports.add("t_range");
	status.imports.add("t_run_control");

	b.append("");
	b.append(`
	/* @html */
	const ${htmlRangeName} = t_range();
	t_run_control(${htmlRangeName}, ${htmlAnchorName}, (t_before) => {`);

	buildHtmlBranch(node, status, b, htmlParentName, htmlRangeName);

	b.append("});");
	b.append("");
}

function buildHtmlBranch(
	node: ControlNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	rangeName: string,
) {
	status.imports.add("t_run_branch");

	//b.append(`${node.statement};`);
	b.append(`t_run_branch(${rangeName}, -1, () => {`);

	//const fragment = node.fragment!;
	//const templateName = `t_template_${fragment.number}`;
	//const fragmentName = `t_fragment_${fragment.number}`;
	const templateName = nextVarName("template", status);
	const fragmentName = nextVarName("fragment", status);
	b.append(`const ${templateName} = document.createElement("template");`);
	b.append(`${templateName}.innerHTML = ${node.statement};`);
	b.append(`let ${fragmentName} = ${templateName}.content.cloneNode(true) as DocumentFragment;`);

	buildAddFragment(node, status, b, parentName, "t_before");

	b.append(`});`);
}
