import $run from "../../../../src/watch/$run";
import $watch from "../../../../src/watch/$watch";
import t_add_element from "../../../../src/render/addElement";
import t_add_fragment from "../../../../src/render/addFragment";
import t_anchor from "../../../../src/render/nodeAnchor";
import t_child from "../../../../src/render/nodeChild";
import t_event from "../../../../src/render/addEvent";
import t_first_inside from "../../../../src/render/firstInsideNode";
import t_fragment_el from "../../../../src/render/getElementFragment";
import t_next from "../../../../src/render/nodeNext";
import t_region from "../../../../src/render/newRegion";
import t_root_el from "../../../../src/render/nodeRootElement";
import t_run_control from "../../../../src/render/runControl";
import type SlotRender from "../../../../src/types/SlotRender";

export default function HtmlTextarea(
	$parent: ParentNode,
	$anchor: Node | null,
	_$props?: Record<PropertyKey, any>,
	_$context?: Record<PropertyKey, any>,
	_$slots?: Record<string, SlotRender>,
): void {

	let $state = $watch({
		text: "first",
		get output() {
			return "<h1>" + $state.text + "</h1>\n<p>End of " + $state.text + "</p>";
		},
	});

	/* User interface */
	const t_fragment_els: Element[] = [];

	const t_fragment_0 = t_fragment_el($parent.ownerDocument!, t_fragment_els, 0, `<div class="card"><textarea></textarea> <div class="output"><!></div></div>`);
	const t_root_0 = t_root_el(t_fragment_0);
	const t_div_1 = t_root_0 as HTMLDivElement;
	const t_textarea_1 = t_child(t_div_1) as HTMLTextAreaElement;
	const t_html_parent_1 = t_next(t_next(t_textarea_1, true)) as HTMLElement;
	let t_html_anchor_1 = t_anchor(t_child(t_next(t_next(t_textarea_1, true)))) as HTMLElement;

	/* @html */
	let t_html_first_1: ChildNode | null = null;
	let t_html_last_1: ChildNode | null = null;
	t_run_control(t_region(), t_html_anchor_1, (t_before) => {
		$state.output;
		if (t_html_first_1 !== null && t_html_last_1 !== null) {
			let t_node: ChildNode | null = t_html_last_1;
			while (t_node !== null && t_node !== t_html_first_1) {
				const t_prev: ChildNode | null = t_node.previousSibling;
				t_node.remove();
				t_node = t_prev;
			}
			if (t_html_first_1) t_html_first_1.remove();
			t_html_first_1 = t_html_last_1 = null;
		}
		let t_template_1 = document.createElement("template");
		t_template_1.innerHTML = $state.output;
		let t_fragment_1 = t_template_1.content.cloneNode(true) as DocumentFragment;
		t_html_first_1 = t_fragment_1.firstChild;
		t_html_last_1 = t_fragment_1.lastChild;
		t_add_fragment(t_fragment_1, t_html_parent_1, t_before);
		if (t_html_first_1 !== null && t_html_first_1.parentNode !== t_html_parent_1) {
			t_html_last_1 = t_html_anchor_1.previousSibling as ChildNode | null;
			if (t_html_last_1 !== null) {
				const t_stashed_first = t_first_inside(t_html_anchor_1 as ChildNode);
				if (t_stashed_first !== undefined && t_stashed_first !== null) {
					t_html_first_1 = t_stashed_first;
				} else {
					t_html_first_1 = t_html_last_1;
					let t_scan: ChildNode | null = t_html_last_1;
					while (t_scan !== null && t_scan.previousSibling !== null && t_scan.previousSibling !== t_html_anchor_1 && (t_scan.previousSibling.nodeType !== 3 || (t_scan.previousSibling.textContent ?? "").trim() !== "")) {
						t_scan = t_scan.previousSibling;
					}
					t_html_first_1 = t_scan;
				}
			}
		}
	});

	$run(() => {
		t_textarea_1.value = String($state.text || "");
	});
	t_event(t_textarea_1, "input", (e) => $state.text = e.target.value);
	t_add_element(t_div_1, $parent, $anchor);
	t_next(t_div_1);

}
