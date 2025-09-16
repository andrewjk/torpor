import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";
import t_attr from "../../../../src/render/formatAttributeText";
import t_fmt from "../../../../src/render/formatText";

export default function ForEscape(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>
) {
	let t_body = "";
	let t_head = "";
	let things = ["a", "b", "c", "d", "e"]

	/* User interface */
	t_body += ` <section> <![>`;
	for (let i = 0; i < 5; i++) {
		t_body += `<!^> <p>${t_fmt(i)}</p> <div data-testid="input1-${t_attr(i)}" ${i ? `name="${t_attr(i)}"` : ''}></div> <div data-testid="input2-${t_attr(i)}" name="${t_attr(i)}"></div> <div data-testid="input3-${t_attr(i)}" ${things[i] ? `name="${t_attr(things[i])}"` : ''}></div> <input value="${t_attr(i) || ""}" name="${t_attr(i)}"> `;
	}
	t_body += `<!]><!> </section> `;

	return { body: t_body, head: t_head };
}
