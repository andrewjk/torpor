import type ServerSlotRender from "../../../../src/types/ServerSlotRender";
import t_class from "../../../../src/render/buildClasses";

export default function Class(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <div id="divid" class="torp-1ouzs8a"> From id </div> <div class="divclass torp-1ouzs8a"> From string </div> <a class="${t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue }, "torp-1ouzs8a")}"> From state </a> <div class="${t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue }, "torp-1ouzs8a")}"> From state with scope </div> <div class="${t_class({ foo: true, bar: false, baz: 5, qux: null }, "torp-1ouzs8a")}"> Class object </div> <div class="${t_class([ "foo", false, true && "baz", undefined ], "torp-1ouzs8a")}"> Class array </div> <div class="${t_class([ "foo", 0, { bar: true }, "", [1 && "baz", ["qux"]] ], "torp-1ouzs8a")}"> Class nested </div> <![>`;
	const t_props_1 = {
		class: t_class({ "child-class": true }, "torp-1ouzs8a"),
	};
	const t_slots_1: Record<string, ServerSlotRender> = {};
	t_slots_1["_"] = (
		// @ts-ignore
		$sprops?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += ` Child class 1 `;
		return t_body;
	}
	const t_comp_1 = Child(t_props_1, $context, t_slots_1);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> <![>`;
	const t_props_2 = {
		class: t_class("pink", "torp-1ouzs8a"),
	};
	const t_slots_2: Record<string, ServerSlotRender> = {};
	t_slots_2["_"] = (
		// @ts-ignore
		$sprops?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += ` Child class 2 `;
		return t_body;
	}
	const t_comp_2 = Child(t_props_2, $context, t_slots_2);
	t_body += t_comp_2.body;
	t_head += t_comp_2.head;
	t_body += `<!]><!> `;

	/* Style */
	t_head += "<style id='1ouzs8a'>div.torp-1ouzs8a { color: blue; } .pink.torp-1ouzs8a { color: pink; } </style>";

	return { body: t_body, head: t_head };
}

function Child(
	$props: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
): { body: string, head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <div class="${t_class($props.class)}"> <![>`;
	if ($slots && $slots["_"]) {
		t_body += $slots["_"](undefined, $context);
	} else {
		t_body += ` Child class `;
	}
	t_body += `<!]><!> </div> `;

	return { body: t_body, head: t_head };
}
