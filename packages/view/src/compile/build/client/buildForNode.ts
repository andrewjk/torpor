import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import isControlNode from "../../utils/isControlNode";
import isForBodyLeafSafe from "../../utils/isForBodyLeafSafe";
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
	// a proxyGet trap per property read during every row effect run.
	const noWatch = isForBodyNoProxySafe(node.children, forVarNames);
	if (noWatch) {
		status.imports.add("t_rerun_region_effects");
	}

	// Single-loop-var specialization of the no-proxy path: when the body
	// binds exactly one loop variable, the per-row spec can store it
	// directly (`data: row`) instead of wrapping it (`data: { row }`). This
	// drops one object allocation per row on EVERY list update — a
	// `removeFirst` click on a 1000-row list allocates 999 `{ row }`
	// wrappers today, all to be GC'd moments later — and turns the
	// `updateListItem` per-field compare into a single reference check. The
	// body's loop-var access flips from `item.data.<var>.x` to
	// `item.data.x` (the substitution below maps `<var>` → `item.data`
	// rather than `item.data.<var>`).
	const singleVar = noWatch && forVarNames.length === 1;

	// Detect "leaf-row safe" @for body: when the body has no nested control
	// statements (`@if`/`@for`/`@await`/…), the create callback can skip its
	// `pushRegion(item)` / `popRegion(oldRegion)` calls. `runListItems` has
	// already pushed the item onto the active region before calling
	// `create()`, and a leaf body never creates descendant regions that
	// would shift `context.activeRegion` away from the item — so the
	// push/pop in the callback is purely redundant. Saves two function calls
	// per row plus the `devContext.onRegionPushed`/`onRegionPopped`
	// invocations (~20000 calls saved on a 10k-row `runlots`).
	//
	// Every no-proxy-safe body is also leaf-safe (`isForBodyNoProxySafe`
	// gates on the same nested-control check), but the converse is not true
	// — a body that writes to a for-var can still be leaf-safe — so this is
	// an independent check.
	const leafRow = isForBodyLeafSafe(node.children);

	status.imports.add("t_region");
	status.imports.add("t_run_list");
	status.imports.add("ListItemSpec");

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
			let ${listItemsName}: ListItemSpec[] = [];`);

	// TODO: replaceForVarNames is going to throw mapping out
	addMappedText("", `${replaceForVarNames(node.statement, status)}`, " {", node.span, status, b);

	// Push a lightweight {key, data} spec per row. The reconciler reuses old
	// ListItems for survivors and only mounts fresh ones for genuinely new
	// keys, so a survivor costs only this 2-field allocation per update — no
	// full ListItem, no effects migration, no per-row chain re-link. When the
	// body is no-proxy safe and binds a single loop var, store it directly
	// (`data: row`) rather than wrapping it (`data: { row }`) so we skip the
	// per-row wrapper-object allocation entirely.
	if (singleVar) {
		b.append(`${listItemsName}.push({ data: ${forVarNames[0]}, key: `);
	} else {
		b.append(`${listItemsName}.push({ data: { ${forVarNames.join(", ")} }, key: `);
	}
	if (key !== undefined) {
		addMappedText("", `${keyStatement || "undefined"}`, " });", key.span, status, b);
	} else {
		b.append(`undefined });`);
	}
	b.append(`}`);
	b.append(`return ${listItemsName};`);
	b.append(`},
		${status.options.dev === true ? `function createListItem(${itemName}, ${beforeName}) {` : `(${itemName}, ${beforeName}) => {`}`);

	let oldForVarNames = status.forVarNames;
	status.forVarNames = [
		...status.forVarNames,
		// singleVar stores the loop var directly as `data`, so the body
		// reads it as `item.data.<x>`; otherwise it's wrapped as
		// `data: { <var> }` and the body reads `item.data.<var>.<x>`.
		...(singleVar
			? forVarNames.map((v) => [v, `${itemName}.data`])
			: forVarNames.map((v) => [v, `${itemName}.data.${v}`])),
	];
	buildForItem(node, status, b, parentName, beforeName, itemName, leafRow);
	status.forVarNames = oldForVarNames;

	b.append(`},
${status.options.dev === true ? "function updateListItem(t_old_item, t_new_item) {" : "(t_old_item, t_new_item) => {"}`);
	if (noWatch) {
		// Compare each forVar's reference. Only when one has actually changed
		// do we copy it across and re-run the item's effects. Unchanged rows
		// (the common case during a partial `update`) cost only the
		// reference-equality check — no allocation, no effect re-run.
		// singleVar collapses this to a single `data` reference check (the
		// loop var IS the data bag, no per-field walk).
		b.append(`let t_changed = false;`);
		if (singleVar) {
			b.append(
				`if (t_old_item.data !== t_new_item.data) {
					t_old_item.data = t_new_item.data;
					t_changed = true;
				}`,
			);
		} else {
			for (let varName of forVarNames) {
				b.append(
					`if (t_old_item.data.${varName} !== t_new_item.data.${varName}) {
						t_old_item.data.${varName} = t_new_item.data.${varName};
						t_changed = true;
					}`,
				);
			}
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
	leafRow: boolean,
) {
	const oldRegionName = nextVarName("old_region", status);

	// Leaf-row specialization: skip the per-item `pushRegion(item)` /
	// `popRegion(oldRegion)` calls. `runListItems` has already pushed the
	// item onto the active region (via `pushRegion(item, true)`) before
	// calling `create()`, and the leaf body never creates descendant regions
	// that would shift `context.activeRegion` away from the item — so the
	// push/pop here is purely redundant. The effect created by the body's
	// `$run` still lands on the right region (`context.activeRegion.effects`
	// === `item.effects`), and the chain bookkeeping in `runListItems`
	// (which uses `context.previousRegion` to link siblings) is unaffected.
	if (!leafRow) {
		status.imports.add("t_push_region");
		b.append(`let ${oldRegionName} = t_push_region(${itemName});`);
	}

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

	if (!leafRow) {
		status.imports.add("t_pop_region");
		b.append(`t_pop_region(${oldRegionName});`);
	}
}
