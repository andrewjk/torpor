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

	// HACK: I'm not actually sure we need this here (or in @replace, where I copied it from)
	node = node.children[0] as ControlNode;

	status.imports.add("t_region");
	status.imports.add("t_run_control");

	const firstNodeVar = nextVarName("html_first", status);
	const lastNodeVar = nextVarName("html_last", status);

	b.append("");
	b.append(`/* @html */`);
	b.append(`let ${firstNodeVar}: ChildNode | null = null;`);
	b.append(`let ${lastNodeVar}: ChildNode | null = null;`);
	b.append(`t_run_control(t_region(), ${htmlAnchorName}, (t_before) => {`);

	// Read the html expression (for reactivity tracking)
	b.append(`${replaceForVarNames(node.statement, status)};`);

	// Clear previously rendered content
	b.append(`if (${firstNodeVar} !== null && ${lastNodeVar} !== null) {`);
	b.append(`let t_node: ChildNode | null = ${lastNodeVar};`);
	b.append(`while (t_node !== null && t_node !== ${firstNodeVar}) {`);
	b.append(`const t_prev = t_node.previousSibling;`);
	b.append(`t_node.remove();`);
	b.append(`t_node = t_prev;`);
	b.append(`}`);
	b.append(`if (${firstNodeVar}) ${firstNodeVar}.remove();`);
	b.append(`${firstNodeVar} = ${lastNodeVar} = null;`);
	b.append(`}`);

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
	b.append(`${firstNodeVar} = ${fragmentName}.firstChild;`);
	b.append(`${lastNodeVar} = ${fragmentName}.lastChild;`);

	buildAddFragment(node, status, b, htmlParentName, "t_before");

	// During hydration the fragment isn't inserted, so adopt the existing
	// server-rendered nodes from the DOM instead
	b.append(`if (${firstNodeVar} !== null && ${firstNodeVar}.parentNode !== ${htmlParentName}) {`);
	b.append(`${lastNodeVar} = ${htmlAnchorName}.previousSibling as ChildNode | null;`);
	b.append(`if (${lastNodeVar} !== null) {`);
	b.append(`${firstNodeVar} = ${lastNodeVar};`);
	b.append(`let t_scan: ChildNode | null = ${lastNodeVar};`);
	b.append(`while (t_scan !== null && t_scan.previousSibling !== null && t_scan.previousSibling !== ${htmlAnchorName} && (t_scan.previousSibling.nodeType !== 3 || (t_scan.previousSibling.textContent ?? "").trim() !== "")) {`);
	b.append(`t_scan = t_scan.previousSibling;`);
	b.append(`}`);
	b.append(`${firstNodeVar} = t_scan;`);
	b.append(`}`);
	b.append(`}`);

	b.append(`}${status.options.dev === true ? ', "html"' : ""});`);
	b.append("");
}
