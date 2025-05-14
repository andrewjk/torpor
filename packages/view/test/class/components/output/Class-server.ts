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
	$output += `<div class="torp-1ljxz83"> <div id="divid" class="torp-1ljxz83"> From id </div> <div class="divclass torp-1ljxz83"> From string </div> <a class="${t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue }, "torp-1ljxz83")}"> From state </a> <div class="${t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue }, "torp-1ljxz83")}"> From state with scope </div> <div class="${t_class({ foo: true, bar: false, baz: 5, qux: null }, "torp-1ljxz83")}"> Class object </div> <div class="${t_class([ "foo", false, true && "baz", undefined ], "torp-1ljxz83")}"> Class array </div> <div class="${t_class([ "foo", 0, { bar: true }, "", [1 && "baz", ["qux"]] ], "torp-1ljxz83")}"> Class nested </div> </div>`;

	return $output;
}
