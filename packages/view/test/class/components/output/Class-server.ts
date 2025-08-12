import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";
import t_class from "../../../../src/render/getClasses";

export default function Class(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let t_body = "";
	let t_head = "<style id='1ljxz83'>div.torp-1ljxz83 { color: blue; } </style>";
	t_body += ` <div id="divid" class="torp-1ljxz83"> From id </div> <div class="divclass torp-1ljxz83"> From string </div> <a class="${t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue }, "torp-1ljxz83")}"> From state </a> <div class="${t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue }, "torp-1ljxz83")}"> From state with scope </div> <div class="${t_class({ foo: true, bar: false, baz: 5, qux: null }, "torp-1ljxz83")}"> Class object </div> <div class="${t_class([ "foo", false, true && "baz", undefined ], "torp-1ljxz83")}"> Class array </div> <div class="${t_class([ "foo", 0, { bar: true }, "", [1 && "baz", ["qux"]] ], "torp-1ljxz83")}"> Class nested </div> <![>`;
	const t_props_1: any = {};
	t_props_1["class"] = t_class({ "child-class": true }, "torp-1ljxz83");

	const t_comp_1 = Child(t_props_1, $context);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}

function Child(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	$props ??= {};

	/* User interface */
	let t_body = "";
	let t_head = "";
	t_body += ` <div ${$props.class ? `class="${t_attr($props.class)}"` : ''}> Child class </div> `;

	return { body: t_body, head: t_head };
}
