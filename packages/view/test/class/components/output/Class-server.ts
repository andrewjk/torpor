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
	t_body += ` <div id="divid" class="torp-16s1yph"> From id </div> <div class="divclass torp-16s1yph"> From string </div> <a ${t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue }, "torp-16s1yph") !== "" ? `class="${t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue }, "torp-16s1yph")}"` : ""}> From state </a> <div ${t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue }, "torp-16s1yph") !== "" ? `class="${t_class({ hello: true, red: $props.red, green: $props.green, blue: $props.blue }, "torp-16s1yph")}"` : ""}> From state with scope </div> <div ${t_class({ foo: true, bar: false, baz: 5, qux: null }, "torp-16s1yph") !== "" ? `class="${t_class({ foo: true, bar: false, baz: 5, qux: null }, "torp-16s1yph")}"` : ""}> Class object </div> <div ${t_class([ "foo", false, true && "baz", undefined ], "torp-16s1yph") !== "" ? `class="${t_class([ "foo", false, true && "baz", undefined ], "torp-16s1yph")}"` : ""}> Class array </div> <div ${t_class([ "foo", 0, { bar: true }, "", [1 && "baz", ["qux"]] ], "torp-16s1yph") !== "" ? `class="${t_class([ "foo", 0, { bar: true }, "", [1 && "baz", ["qux"]] ], "torp-16s1yph")}"` : ""}> Class nested </div> <![>`;
	const t_props_1 = {
		class: t_class("hey", "torp-16s1yph"),
	};
	const t_slots_1: Record<string, ServerSlotRender> = {};
	t_slots_1["_"] = (
		// @ts-ignore
		$sprops?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += ` Class filtered `;
		return t_body;
	}
	const t_comp_1 = Child(t_props_1, $context, t_slots_1);
	t_body += t_comp_1.body;
	t_head += t_comp_1.head;
	t_body += `<!]><!> <![>`;
	const t_props_2 = {
		class: t_class({ "child-class": true }, "torp-16s1yph"),
	};
	const t_slots_2: Record<string, ServerSlotRender> = {};
	t_slots_2["_"] = (
		// @ts-ignore
		$sprops?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += ` Child class 1 `;
		return t_body;
	}
	const t_comp_2 = Child(t_props_2, $context, t_slots_2);
	t_body += t_comp_2.body;
	t_head += t_comp_2.head;
	t_body += `<!]><!> <![>`;
	const t_props_3 = {
		class: t_class("pink", "torp-16s1yph"),
	};
	const t_slots_3: Record<string, ServerSlotRender> = {};
	t_slots_3["_"] = (
		// @ts-ignore
		$sprops?: Record<PropertyKey, any>,
		// @ts-ignore
		$context?: Record<PropertyKey, any>
	) => {
		let t_body = "";
		t_body += ` Child class 2 `;
		return t_body;
	}
	const t_comp_3 = Child(t_props_3, $context, t_slots_3);
	t_body += t_comp_3.body;
	t_head += t_comp_3.head;
	t_body += `<!]><!> `;

	/* Style */
	t_head += "<style id='16s1yph'>div.torp-16s1yph { color: blue; } .pink.torp-16s1yph { color: pink; } .hey[data-state='active'].torp-16s1yph { color: green; } </style>";

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
	t_body += ` <div ${t_class($props.class) !== "" ? `class="${t_class($props.class)}"` : ""} data-state="active"> <![>`;
	if ($slots && $slots["_"]) {
		t_body += $slots["_"](undefined, $context);
	} else {
		t_body += ` Child class `;
	}
	t_body += `<!]><!> </div> `;

	return { body: t_body, head: t_head };
}
