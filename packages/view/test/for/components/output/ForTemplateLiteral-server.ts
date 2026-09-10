import t_attr from "../../../../src/render/formatAttributeText";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default async function ForTemplateLiteral(
	$props: { slides: { index: number }[] },
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, ServerSlotRender>,
): Promise<{ body: string; head: string }> {
	let t_body = "";
	let t_head = "";

	/* User interface */
	t_body += `<section><![>`;
	for (let slide of $props.slides) {
		t_body += `<!^><p ${`Go to slide ${slide.index + 1}` ? `aria-label="${t_attr(`Go to slide ${slide.index + 1}`)}"` : ""}>Slide</p> <p ${`slide show` ? `aria-label="${t_attr(`slide show`)}"` : ""}>Constant</p>`;
	}
	t_body += `<!]><!></section>`;

	return { body: t_body, head: t_head };
}
