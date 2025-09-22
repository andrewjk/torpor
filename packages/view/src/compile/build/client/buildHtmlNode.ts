import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import buildAddFragment from "./buildAddFragment";

export default function buildHtmlNode(node: ControlNode, status: BuildStatus, b: Builder): void {
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

	b.append(`${node.statement};`);
	b.append(`t_run_branch(${rangeName}, () => {`);

	const templateName = nextVarName("template", status);
	const fragmentName = `t_fragment_${node.fragment!.number}`;
	b.append(`const ${templateName} = document.createElement("template");`);
	b.append(`${templateName}.innerHTML = ${node.statement};`);
	b.append(`let ${fragmentName} = ${templateName}.content.cloneNode(true) as DocumentFragment;`);

	buildAddFragment(node, status, b, parentName, "t_before");

	b.append(`});`);
}
