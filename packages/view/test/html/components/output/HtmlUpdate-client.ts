import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_region from "../../../../src/render/newRegion";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_control from "../../../../src/render/runControl";
import type SlotRender from "../../../../src/types/SlotRender";

export default function HtmlUpdate(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { html: string },
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, SlotRender>,
): void {

	/* User interface */
	const t_fragments: DocumentFragment[] = [];
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<div id="target"><!></div>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_div_1 = t_root_0 as HTMLDivElement;
	let t_html_anchor_1 = t_anchor(t_child(t_div_1)) as HTMLElement;

	/* @html */
	let t_html_first_1: ChildNode | null = null;
	let t_html_last_1: ChildNode | null = null;
	t_run_control(t_region(), t_html_anchor_1, (t_before) => {
		$props.html;
		if (t_html_first_1 !== null && t_html_last_1 !== null) {
			let t_node: ChildNode | null = t_html_last_1;
			while (t_node !== null && t_node !== t_html_first_1) {
				const t_prev = t_node.previousSibling;
				t_node.remove();
				t_node = t_prev;
			}
			if (t_html_first_1) t_html_first_1.remove();
			t_html_first_1 = t_html_last_1 = null;
		}
		let t_template_1 = document.createElement("template");
		t_template_1.innerHTML = $props.html;
		let t_fragment_1 = t_template_1.content.cloneNode(true) as DocumentFragment;
		t_html_first_1 = t_fragment_1.firstChild;
		t_html_last_1 = t_fragment_1.lastChild;
		t_add_fragment(t_fragment_1, t_div_1, t_before);
		if (t_html_first_1 !== null && t_html_first_1.parentNode !== t_div_1) {
			t_html_last_1 = t_html_anchor_1.previousSibling as ChildNode | null;
			if (t_html_last_1 !== null) {
				t_html_first_1 = t_html_last_1;
				let t_scan: ChildNode | null = t_html_last_1;
				while (t_scan !== null && t_scan.previousSibling !== null && t_scan.previousSibling !== t_html_anchor_1 && (t_scan.previousSibling.nodeType !== 3 || (t_scan.previousSibling.textContent ?? "").trim() !== "")) {
					t_scan = t_scan.previousSibling;
				}
				t_html_first_1 = t_scan;
			}
		}
	});

	t_add_element(t_div_1, $parent, $anchor);
	t_next(t_div_1);

}
