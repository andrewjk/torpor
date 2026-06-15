import t_fmt from "../../../../src/render/formatText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function IfForSwitchCombo(
	$props: { todos: { text: string; done: boolean; priority: string }[]; filter: string; sort: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
): { body: string; head: string } {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <![>`;
	if ($props.todos.length === 0) {
		t_body += `<!^> <p>No todos</p> `;
	}
	else {
		t_body += `<!^> <![>`;
		for (let todo of $props.todos) {
			t_body += `<!^> <![>`;
			if ($props.filter === "all" || ($props.filter === "done" && todo.done) || ($props.filter === "pending" && !todo.done)) {
				t_body += `<!^> <li> <![>`;
				switch (todo.priority) {
					case "high": {
						t_body += `<!^> <strong>[HIGH] ${t_fmt(todo.text)}</strong> `;
						break;
					}
					case "low": {
						t_body += `<!^> <em>[low] ${t_fmt(todo.text)}</em> `;
						break;
					}
					default: {
						t_body += `<!^> <span>[med] ${t_fmt(todo.text)}</span> `;
						break;
					}
				}
				t_body += `<!]><!> </li> `;
			}
			t_body += `<!]><!> `;
		}
		t_body += `<!]><!> `;
	}
	t_body += `<!]><!> `;

	return { body: t_body, head: t_head };
}
