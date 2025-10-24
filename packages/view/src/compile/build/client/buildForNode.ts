import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import isControlNode from "../../utils/isControlNode";
import trimEnd from "../../utils/trimEnd";
import trimMatched from "../../utils/trimMatched";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import addMappedText from "./addMappedText";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import replaceForVarNames from "./replaceForVarNames";

const forLoopRegex = /for\s*\((.+?);.*?;.*?\)/;
const forLoopVarsRegex = /(?:let\s+|var\s+){0,1}([^\s,;+=]+)(?:\s*=\s*[^,;]+){0,1}/g;
const forOfRegex = /for\s*\(\s*(?:let\s*|var\s*){0,1}(.+?)\s+(?:of|in).*?\)/;

export default function buildForNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	const forParentName = node.parentName!;
	const forAnchorName = node.varName!;

	// HACK:
	node = node.children[0] as ControlNode;

	// HACK: Need to wrangle the declaration(s) out of the for loop and put them in data
	// TODO: Handle destructuring, quotes, comments etc
	const forVarNames: string[] = [];
	const forIndexMatch = node.statement.match(forLoopRegex);
	if (forIndexMatch) {
		const forVarMatches = forIndexMatch[1].matchAll(forLoopVarsRegex);
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

	const forRegionName = nextVarName("for_region", status);

	// Get the key node if it's been set
	const key = node.children.find(
		(n) => n.type === "control" && (n as ControlNode).operation === "@key",
	);
	let keyStatement = key ? (key as ControlNode).statement : "";
	if (keyStatement) {
		keyStatement = trimEnd(keyStatement.substring(keyStatement.indexOf("=") + 1).trim(), ";");
	}

	status.imports.add("t_region");
	status.imports.add("t_run_list");
	status.imports.add("t_list_item");
	status.imports.add("ListItem");

	b.append("");
	b.append(`
	/* @for */
	let ${forRegionName} = t_region(${status.options.dev === true ? `"for"` : ""});
	t_run_list(
	${forRegionName},
	${forParentName},
	${forAnchorName},
	${status.options.dev === true ? "function createNewItems() {" : "(t_old_items) => {"}
		let t_new_items = new Map<PropertyKey, ListItem>();
		let t_previous_region = ${forRegionName};
		// TODO: store nextSiblingRegion? for lists only???
		let t_next_region = ${forRegionName}.nextRegion;
		while (t_next_region !== null) {
			if (t_next_region.depth <= ${forRegionName}.depth) break;
			t_next_region = t_next_region.nextRegion;
		}
		let t_index = 0;
	`);

	// TODO: replaceForVarNames is going to throw mapping out
	addMappedText("", `${replaceForVarNames(node.statement, status)}`, " {", node.span, status, b);

	status.imports.add("$watch");
	let params = [`$watch({ ${forVarNames.join(", ")} }, { shallow: true })`, "t_index"];
	// Not sure if we need to be storing the key
	if (keyStatement) params.push(keyStatement);
	if (status.options.dev === true) params.push(`"for item"`);
	b.append(`
			let t_key = ${keyStatement || "t_index"};
			let t_item: ListItem;
			let t_old_item = t_old_items.get(t_key);
			if (t_old_item !== undefined) {
				t_new_items.set(t_key, t_old_item);
				t_item = t_old_item;
				t_item.state = 1;`);
	for (let varName of forVarNames) {
		b.append(`t_item.data.${varName} = ${varName};`);
	}
	b.append(`} else {
				t_item = t_list_item(
					$watch({ ${forVarNames.join(", ")} }, { shallow: true }),
					t_index,
					(t_before) => {`);
	let oldForVarNames = status.forVarNames;
	status.forVarNames = [...status.forVarNames, ...forVarNames];
	buildForItem(node, status, b, forParentName);
	status.forVarNames = oldForVarNames;
	b.append(`
					},
					${keyStatement ?? "undefined"}${status.options.dev === true ? ',\n"for item"' : ""});
				t_new_items.set(t_key, t_item);
			}
			t_item.previousRegion = t_previous_region;
			t_previous_region.nextRegion = t_item;
			t_previous_region = t_item;
			t_index++;
		}
		t_previous_region.nextRegion = t_next_region;
		return t_new_items;
	});`);
	b.append("");
}

function buildForItem(node: ControlNode, status: BuildStatus, b: Builder, parentName: string) {
	const oldRegionName = nextVarName("old_region", status);

	status.imports.add("t_push_region");
	b.append(`let ${oldRegionName} = t_push_region(t_item);`);

	buildFragment(node, status, b, parentName, "t_before");

	status.fragmentStack.push({
		fragment: node.fragment!,
		path: "",
	});
	for (let child of node.children) {
		if (isControlNode(child) && child.operation === "@key") {
			continue;
		}
		buildNode(child, status, b, parentName, "t_before");
	}
	status.fragmentStack.pop();

	buildAddFragment(node, status, b, parentName, "t_before");

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
