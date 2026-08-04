import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import isControlNode from "../../utils/isControlNode";
import isForBodyNoProxySafe from "../../utils/isForBodyNoProxySafe";
import trimMatched from "../../utils/trimMatched";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import addMappedText from "./addMappedText";
import addPopDevBoundary from "./addPopDevBoundary";
import addPushDevBoundary from "./addPushDevBoundary";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import replaceForVarNames from "./replaceForVarNames";

const forLoopRegex = /for\s*\((.+?);.*?;.*?\)/;
const forLoopVarsRegex = /(?:let\s+|var\s+){0,1}([^\s,;+=]+)(?:\s*=\s*[^,;]+){0,1}/g;
const forOfRegex = /for\s*\(\s*(?:let\s*|var\s*){0,1}(.+?)\s+(?:of|in).*?\)/;

export default function buildForNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	const parentName = node.parentName!;
	const anchorName = node.varName ?? "null";

	// HACK:
	node = node.children[0] as ControlNode;

	// HACK: Need to wrangle the declaration(s) out of the for loop and put them in data
	// TODO: Handle destructuring, quotes, comments etc
	const forVarNames: string[] = [];
	const forLoopMatch = node.statement.match(forLoopRegex);
	if (forLoopMatch) {
		const forVarMatches = forLoopMatch[1].matchAll(forLoopVarsRegex);
		for (let match of forVarMatches) {
			forVarNames.push(match[1]);
		}
	} else {
		const forOfMatch = node.statement.match(forOfRegex);
		if (forOfMatch) {
			const match = forOfMatch[1];
			if (
				(match.startsWith("{") && match.endsWith("}")) ||
				(match.startsWith("[") && match.endsWith("]"))
			) {
				forVarNames.push(
					...trimMatched(trimMatched(match, "{", "}"), "[", "]")
						.split(",")
						.map((m) => m.trim()),
				);
			} else {
				forVarNames.push(match);
			}
		}
	}

	const regionName = nextVarName("for_region", status);
	const listItemsName = nextVarName("new_items", status);
	const previousItemName = nextVarName("previous_item", status);
	const nextItemName = nextVarName("next_item", status);
	const newItemName = nextVarName("new_item", status);
	const itemName = nextVarName("item", status);
	const beforeName = nextVarName("before", status);

	// Get the key node if it's been set
	let keyStatement = "";
	const key = node.children.find(
		(n) => n.type === "control" && (n as ControlNode).operation === "@key",
	) as ControlNode;
	if (key !== undefined) {
		let matches = key.statement.match(/^(\s*@*key\s*=\s*)(.+?)\s*;*\s*$/);
		if (matches) {
			key.span.start += matches[1].length;
			keyStatement = matches[2];
		}
	}

	// Detect "no-proxy safe" @for body: when none of the for-vars are ever
	// written inside the body, the per-item data bag doesn't need to be
	// wrapped in a shallow `$watch` Proxy. The compiler-emitted updateListItem
	// then compares each forVar's reference and re-runs the item's effects
	// manually (via t_rerun_region_effects) when one has actually changed.
	// Skips a Proxy + ProxyData + signals Map allocation per created row, and
	// a proxyGet trap per property read during every row-effect run.
	const noWatch = isForBodyNoProxySafe(node.children, forVarNames);
	if (noWatch) {
		status.imports.add("t_rerun_region_effects");
	}

	status.imports.add("t_region");
	status.imports.add("t_run_list");
	status.imports.add("t_list_item");
	status.imports.add("ListItem");

	b.append("");
	b.append("/* @for */");
	addPushDevBoundary("control", `@${node.statement}`, status, b);
	b.append(`
		let ${regionName} = t_region(${status.options.dev === true ? `"for"` : ""});
		t_run_list(
		${regionName},
		${parentName},
		${anchorName},
		${status.options.dev === true ? "function createNewItems() {" : "() => {"}
			let ${listItemsName}: ListItem[] = [];
			let ${previousItemName} = ${regionName};
			let ${nextItemName} = ${regionName}.nextRegion;`);

	// TODO: replaceForVarNames is going to throw mapping out
	addMappedText("", `${replaceForVarNames(node.statement, status)}`, " {", node.span, status, b);

	b.append(`let ${newItemName} = t_list_item(`);
	// TODO: Should map these
	b.append(`{ ${forVarNames.join(", ")} },`);
	if (key !== undefined) {
		addMappedText("", `${keyStatement || "undefined"}`, ",", key.span, status, b);
	}
	if (status.options.dev === true) {
		b.append(`"for item"`);
	}
	b.append(");");
	b.append(`
		${newItemName}.previousRegion = ${previousItemName};
		${previousItemName}.nextRegion = ${newItemName};
		${previousItemName} = ${newItemName};
		${listItemsName}.push(${newItemName});
	}
	${regionName}.nextRegion = ${nextItemName};
	return ${listItemsName};
},
${status.options.dev === true ? `function createListItem(${itemName}, ${beforeName}) {` : `(${itemName}, ${beforeName}) => {`}`);

	let oldForVarNames = status.forVarNames;
	status.forVarNames = [
		...status.forVarNames,
		...forVarNames.map((v) => [v, `${itemName}.data.${v}`]),
	];
	buildForItem(node, status, b, parentName, beforeName, itemName);
	status.forVarNames = oldForVarNames;

	b.append(`},
${status.options.dev === true ? "function updateListItem(t_old_item, t_new_item) {" : "(t_old_item, t_new_item) => {"}`);
	if (noWatch) {
		// Compare each forVar's reference. Only when one has actually changed
		// do we copy it across and re-run the item's effects. Unchanged rows
		// (the common case during a partial `update`) cost only the
		// reference-equality check — no allocation, no effect re-run.
		b.append(`let t_changed = false;`);
		for (let varName of forVarNames) {
			b.append(
				`if (t_old_item.data.${varName} !== t_new_item.data.${varName}) {
					t_old_item.data.${varName} = t_new_item.data.${varName};
					t_changed = true;
				}`,
			);
		}
		b.append(`if (t_changed) t_rerun_region_effects(t_old_item);`);
	} else {
		for (let varName of forVarNames) {
			b.append(`t_old_item.data.${varName} = t_new_item.data.${varName};`);
		}
	}
	b.append(`}${noWatch ? ",\ntrue" : ""}\n);`);

	addPopDevBoundary(status, b);

	b.append("");
}

function buildForItem(
	node: ControlNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	beforeName: string,
	itemName: string,
) {
	const oldRegionName = nextVarName("old_region", status);

	status.imports.add("t_push_region");
	b.append(`let ${oldRegionName} = t_push_region(${itemName});`);

	buildFragment(node, status, b, parentName, beforeName);

	status.fragmentStack.push({
		fragment: node.fragment!,
		path: "",
	});
	for (let child of node.children) {
		if (isControlNode(child) && child.operation === "@key") {
			continue;
		}
		buildNode(child, status, b, parentName, beforeName);
	}
	status.fragmentStack.pop();

	buildAddFragment(node, status, b, parentName, beforeName);

	// If we wanted to return the fragment instead:
	//b.append(`t_item.startNode = t_fragment_1.firstChild;`);
	//b.append(`t_item.endNode = t_fragment_1.lastChild;`);
	//for (let ev of node.fragment!.events) {
	//  b.append(`${ev.varName}.addEventListener("${ev.eventName}", ${ev.handler});`);
	//}

	status.imports.add("t_pop_region");
	b.append(`t_pop_region(${oldRegionName});`);

	// If we wanted to return the fragment instead:
	//b.append(`return t_fragment_${node.fragment!.number};`);
}
