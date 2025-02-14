import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_class from "../../../../src/render/getClasses";

export default function Class(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {

	/* User interface */
	let $output = "";
	$output += `<div> <div class="${t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue })}"> Hello! </div> <div class="${t_class({ foo: true, bar: false, baz: 5, qux: null })}"> Class object </div> <div class="${t_class([ "foo", false, true && "baz", undefined ])}"> Class array </div> <div class="${t_class([ "foo", 0, { bar: true }, "", [1 && "baz", ["qux"]] ])}"> Class nested </div> </div>`;

	return $output;
}
