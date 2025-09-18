import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function FunnyButton(
	_$props: Record<PropertyKey, any>,
	$context: Record<PropertyKey, any>,
	$slots: Record<string, ServerSlotRender>
) {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += ` <button style="
				background: rgba(0, 0, 0, 0.4);
				color: #fff;
				padding: 10px 20px;
				font-size: 30px;
				border: 2px solid #fff;
				margin: 8px; transform: scale(0.9);
				box-shadow: 4px 4px rgba(0, 0, 0, 0.4);
				transition: transform 0.2s cubic-bezier(0.34, 1.65, 0.88, 0.925) 0s;
				outline: 0;
			"> <![>`;
	if ($slots && $slots["_"]) {
		t_body += $slots["_"](undefined, $context);
	} else {
		t_body += ` <span>No content found</span> `;
	}
	t_body += `<!]><!> </button> `;

	return { body: t_body, head: t_head };
}
