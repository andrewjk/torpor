import type RootNode from "../types/nodes/RootNode";
import type TemplateNode from "../types/nodes/TemplateNode";
import collectMarkupExpressions from "./collectMarkupExpressions";
import { codeRanges } from "./codeScanner";
import getContextUsage from "./getContextUsage";
import markupRendersComponent from "./markupRendersComponent";

/**
 * Returns true if a slot fill's content uses the `$context` parameter that
 * the generated fill function declares: rendering a child component or slot
 * forwards `$context` positionally (see buildComponentNode / buildSlotNode
 * and their server counterparts), and a direct `$context` read in one of the
 * fill's own expressions (interpolation, reactive attribute, event handler,
 * control statement) reads it.
 *
 * Bias is towards `true`: when uncertain we keep `$context` named, which is
 * always safe at the cost of a missed unused-parameter cleanup.
 */
export default function fillUsesContext(fill: TemplateNode): boolean {
	const children = (fill as { children?: TemplateNode[] }).children ?? [];
	if (markupRendersComponent({ children } as RootNode)) return true;

	const expressions = collectMarkupExpressions(fill);
	return getContextUsage(expressions, codeRanges(expressions)) !== undefined;
}
