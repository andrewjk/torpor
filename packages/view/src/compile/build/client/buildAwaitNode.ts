import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import isControlNode from "../../utils/isControlNode";
import trimMatched from "../../utils/trimMatched";
import nextVarName from "../utils/nextVarName";
import type BuildStatus from "./BuildStatus";
import addMappedText from "./addMappedText";
import buildAddFragment from "./buildAddFragment";
import buildFragment from "./buildFragment";
import buildNode from "./buildNode";
import replaceForVarNames from "./replaceForVarNames";

export default function buildAwaitNode(node: ControlNode, status: BuildStatus, b: Builder): void {
	const anchorName = node.varName!;
	const parentName = node.parentName!;
	const rangeName = nextVarName("await_range", status);
	const stateName = "$" + nextVarName("await_state", status);
	const creatorsName = nextVarName("await_creators", status);
	const awaitVarsName = nextVarName("await_vars", status);

	// Filter non-control branches (spaces)
	const branches = node.children.filter((n) => isControlNode(n)) as ControlNode[];

	// Make sure all branches exist
	let awaitBranch = branches.find((n) => n.operation === "@await")!;
	if (!awaitBranch) {
		// TODO: Error handling
	}
	let thenBranch = branches.find((n) => n.operation === "@then");
	if (!thenBranch) {
		thenBranch = {
			type: "control",
			operation: "@then",
			statement: "then",
			children: [],
			range: { start: 0, end: 0 },
		};
	}
	let catchBranch = branches.find((n) => n.operation === "@catch");
	if (!catchBranch) {
		catchBranch = {
			type: "control",
			operation: "@catch",
			statement: "catch",
			children: [],
			range: { start: 0, end: 0 },
		};
	}

	const awaiterName = trimMatched(awaitBranch.statement.substring("await".length).trim(), "(", ")");
	const thenVar = trimMatched(thenBranch.statement.substring("then".length).trim(), "(", ")");
	const catchVar = trimMatched(catchBranch.statement.substring("catch".length).trim(), "(", ")");

	// Use an incrementing token to make sure only the last request gets handled
	// TODO: This might have unforeseen consequences
	status.imports.add("$watch");
	status.imports.add("$run");
	status.imports.add("t_range");
	status.imports.add("t_run_control");
	status.imports.add("t_run_branch");

	b.append("");
	b.append(`
		/* @await */
		const ${rangeName} = t_range();
		let ${stateName} = $watch({ index: -1 });
		let ${creatorsName}: ((t_before: Node | null) => void)[] = [];`);

	b.append(`
		let ${awaitVarsName} = { t_token: 0 };
		$run(function runAwait() {`);

	let index = 0;

	// Build the waiting branch before anything happens
	buildAwaitBranch(awaitBranch, status, b, parentName, stateName, creatorsName, index++);

	b.append(`${awaitVarsName}.t_token++;
			((t_token) => {`);

	// TODO: replaceForVarNames is going to throw mapping out
	awaitBranch.range.start += "await".length + 2;
	addMappedText("", replaceForVarNames(awaiterName, status), "", awaitBranch.range, status, b);

	// TODO: replaceForVarNames is going to throw mapping out
	thenBranch.range.start -= 1;
	addMappedText(
		".then((",
		replaceForVarNames(thenVar, status),
		") => {",
		thenBranch.range,
		status,
		b,
	);

	b.append(`if (t_token === ${awaitVarsName}.t_token) {`);
	buildAwaitBranch(thenBranch, status, b, parentName, stateName, creatorsName, index++);
	b.append(`}
		})`);

	// TODO: replaceForVarNames is going to throw mapping out
	catchBranch.range.start -= 1;
	addMappedText(
		".catch((",
		replaceForVarNames(catchVar, status),
		") => {",
		catchBranch.range,
		status,
		b,
	);

	b.append(`
		if (t_token === ${awaitVarsName}.t_token) {`);
	buildAwaitBranch(catchBranch, status, b, parentName, stateName, creatorsName, index++);
	b.append(`}
				});
			})(${awaitVarsName}.t_token);
		});`);

	b.append(`
		t_run_control(${rangeName}, ${anchorName}, (t_before) => {
			t_run_branch(${rangeName}, () => ${creatorsName}[${stateName}.index](t_before));
		});`);
	b.append("");
}

function buildAwaitBranch(
	node: ControlNode,
	status: BuildStatus,
	b: Builder,
	parentName: string,
	stateName: string,
	creatorsName: string,
	index: number,
) {
	if (node.children.length > 0) {
		b.append(`${creatorsName}[${index}] = (t_before) => {`);

		buildFragment(node, status, b, parentName, "t_before");

		status.fragmentStack.push({
			fragment: node.fragment!,
			path: "",
		});
		for (let child of node.children) {
			buildNode(child, status, b, parentName, "t_before");
		}
		status.fragmentStack.pop();

		buildAddFragment(node, status, b, parentName, "t_before");

		b.append("};");
	} else {
		b.append(`${creatorsName}[${index}] = (_) => {};`);
	}

	b.append(`${stateName}.index = ${index};`);
}
