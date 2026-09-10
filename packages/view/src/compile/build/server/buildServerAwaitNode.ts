import type ControlNode from "../../types/nodes/ControlNode";
import Builder from "../../utils/Builder";
import isControlNode from "../../utils/isControlNode";
import nextVarName from "../utils/nextVarName";
import type BuildServerStatus from "./BuildServerStatus";
import buildServerNode from "./buildServerNode";
import flushOutput from "./flushOutput";

/**
 * Builds an `@await` boundary for the server (ASYNC.md §7.10).
 *
 * Rather than inlining the `with` branch (the old shape), the boundary is
 * handed to the `t_await_server` runtime helper: content and `with` branches
 * become closures, and the helper decides at render time whether resolved
 * content can ship (all `source: "server"` reads settled) or the `with`
 * branch + client fetch is the honest output. The runtime emits the
 * hydration markers and anchor itself, including the `<!--t-await:...-->`
 * values payload for resolved boundaries.
 */
export default function buildServerAwaitNode(
	node: ControlNode,
	status: BuildServerStatus,
	b: Builder,
): void {
	flushOutput(status, b);

	status.imports.add("t_await_server");

	const id = status.awaitCount++;
	const resultName = nextVarName("await", status);

	b.append(`const ${resultName} = await t_await_server("${id}", async () => {`);

	// Content branch: rendered speculatively (to start the server fetches),
	// then again once they settle
	b.append(`let t_body = "";`);
	b.append(`let t_head = "";`);
	for (let branch of node.children) {
		if (isControlNode(branch) && branch.operation === "@await") {
			for (let child of branch.children) {
				buildServerNode(child, status, b);
			}
		}
	}
	flushOutput(status, b);
	b.append(`return { body: t_body, head: t_head };`);

	// With branch: rendered on a timeout, on a render pass that doesn't match
	// the collect pass, or when no server reads were recorded
	b.append(`}, async () => {`);
	b.append(`let t_body = "";`);
	b.append(`let t_head = "";`);
	for (let branch of node.children) {
		if (isControlNode(branch) && branch.operation === "@with") {
			for (let child of branch.children) {
				buildServerNode(child, status, b);
			}
		}
	}
	flushOutput(status, b);
	b.append(`return { body: t_body, head: t_head };`);
	b.append(`});`);

	b.append(`${status.inHead ? "t_head" : "t_body"} += ${resultName}.body;`);
	b.append(`t_head += ${resultName}.head;`);
}
