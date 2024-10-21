import { $run } from "@tera/view";
import { $watch } from "@tera/view";
import type { ListItem } from "@tera/view";
import type { SlotRender } from "@tera/view";
import { t_add_fragment } from "@tera/view";
import { t_anchor } from "@tera/view";
import { t_apply_props } from "@tera/view";
import { t_child } from "@tera/view";
import { t_event } from "@tera/view";
import { t_fmt } from "@tera/view";
import { t_fragment } from "@tera/view";
import { t_list_item } from "@tera/view";
import { t_next } from "@tera/view";
import { t_pop_range } from "@tera/view";
import { t_push_range } from "@tera/view";
import { t_range } from "@tera/view";
import { t_root } from "@tera/view";
import { t_run_list } from "@tera/view";

const Bench = {
	/**
	 * The component's name.
	 */
	name: "Bench",
	/**
	 * Mounts or hydrates the component into the supplied parent node.
	 * @param $parent -- The parent node.
	 * @param $anchor -- The node to mount the component before.
	 * @param $props -- The values that have been passed into the component as properties.
	 * @param $context -- Values that have been passed into the component from its ancestors.
	 * @param $slots -- Functions for rendering children into slot nodes within the component.
	 */
	render: ($parent: ParentNode, $anchor: Node | null, $props?: Record<PropertyKey, any>, $context?: Record<PropertyKey, any>, $slots?: Record<string, SlotRender>) => {
		/* User script */
		let rowId = 1;
		let $state = $watch({
			data: [],
			selected: null,
		});

		const adjectives = [
			"pretty",
			"large",
			"big",
			"small",
			"tall",
			"short",
			"long",
			"handsome",
			"plain",
			"quaint",
			"clean",
			"elegant",
			"easy",
			"angry",
			"crazy",
			"helpful",
			"mushy",
			"odd",
			"unsightly",
			"adorable",
			"important",
			"inexpensive",
			"cheap",
			"expensive",
			"fancy",
		];
		const colours = ["red", "yellow", "blue", "green", "pink", "brown", "purple", "brown", "white", "black", "orange"];
		const nouns = [
			"table",
			"chair",
			"house",
			"bbq",
			"desk",
			"car",
			"pony",
			"cookie",
			"sandwich",
			"burger",
			"pizza",
			"mouse",
			"keyboard",
		];

		function append() {
			$state.data = [...$state.data, ...buildData(1000)];
		}

		function clear() {
			$state.data = [];
		}

		function partialUpdate() {
			for (let i = 0; i < $state.data.length; i += 10) {
				const row = $state.data[i];
				row.label = row.label + " !!!";
			}
		}

		function remove(row) {
			const clone = $state.data.slice();
			clone.splice(clone.indexOf(row), 1);
			$state.data = clone;
		}

		function create() {
			// TODO: Build this up to 1000:
			$state.data = buildData(10);
		}

		function createLots() {
			$state.data = buildData(10000);
		}

		function swapRows() {
			if ($state.data.length > 998) {
				const clone = $state.data.slice();
				const tmp = clone[1];
				clone[1] = clone[998];
				clone[998] = tmp;
				$state.data = clone;
			}
		}

		function _random(max) {
			return Math.round(Math.random() * 1000) % max;
		}

		class Item {
			id = rowId++;
			label = `${adjectives[_random(adjectives.length)]} ${colours[_random(colours.length)]} ${nouns[_random(nouns.length)]}`;
		}

		function buildData(count = 1000) {
			const data = new Array(count);
			for (let i = 0; i < count; i++) {
				data[i] = $watch(new Item());
			}
			return data;
		}
		
		/* User interface */
		const t_fragments: DocumentFragment[] = [];

		const t_fragment_0 = t_fragment(t_fragments, 0, `<div id="main" class="container"> <div class="jumbotron"> <div class="row"> <div class="col-md-6"> <h1>Tera (keyed)</h1> </div> <div class="col-md-6"> <div class="row"> <div class="col-sm-6 smallpad"> <button type="button" class="btn btn-primary btn-block" id="create">Create 1,000 rows</button> </div> <div class="col-sm-6 smallpad"> <button type="button" class="btn btn-primary btn-block" id="createlots"> Create 10,000 rows </button> </div> <div class="col-sm-6 smallpad"> <button type="button" class="btn btn-primary btn-block" id="append"> Append 1,000 rows </button> </div> <div class="col-sm-6 smallpad"> <button type="button" class="btn btn-primary btn-block" id="update"> Update every 10th row </button> </div> <div class="col-sm-6 smallpad"> <button type="button" class="btn btn-primary btn-block" id="clear">Clear</button> </div> <div class="col-sm-6 smallpad"> <button type="button" class="btn btn-primary btn-block" id="swaprows">Swap Rows</button> </div> </div> </div> </div> </div> <table class="table table-hover table-striped test-data"> <tbody> <!> </tbody> </table> <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span> </div>`);
		const t_div_1 = t_root(t_fragment_0) as HTMLDivElement;
		const t_button_1 = t_next(t_child(t_next(t_child(t_next(t_child(t_next(t_next(t_next(t_child(t_next(t_child(t_next(t_child(t_div_1)))))))))))))) as HTMLElement;
		const t_button_2 = t_next(t_child(t_next(t_next(t_next(t_child(t_next(t_child(t_next(t_next(t_next(t_child(t_next(t_child(t_next(t_child(t_div_1)))))))))))))))) as HTMLElement;
		const t_button_3 = t_next(t_child(t_next(t_next(t_next(t_next(t_next(t_child(t_next(t_child(t_next(t_next(t_next(t_child(t_next(t_child(t_next(t_child(t_div_1)))))))))))))))))) as HTMLElement;
		const t_button_4 = t_next(t_child(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_child(t_next(t_child(t_next(t_next(t_next(t_child(t_next(t_child(t_next(t_child(t_div_1)))))))))))))))))))) as HTMLElement;
		const t_button_5 = t_next(t_child(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_child(t_next(t_child(t_next(t_next(t_next(t_child(t_next(t_child(t_next(t_child(t_div_1)))))))))))))))))))))) as HTMLElement;
		const t_button_6 = t_next(t_child(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_next(t_child(t_next(t_child(t_next(t_next(t_next(t_child(t_next(t_child(t_next(t_child(t_div_1)))))))))))))))))))))))) as HTMLElement;
		const t_for_parent_1 = t_next(t_child(t_next(t_next(t_next(t_child(t_div_1)))))) as HTMLElement;
		const t_for_anchor_1 = t_anchor(t_next(t_child(t_for_parent_1))) as HTMLElement;

		/* @for */
		let t_for_range_1 = t_range();
		t_run_list(
			t_for_range_1,
			t_for_parent_1,
			t_for_anchor_1,
			function createNewItems() {
				let t_new_items: ListItem[] = [];
				for (let row of $state.data) {
					t_new_items.push(t_list_item({ row }, row.id));
					/*t_new_items.push({
						key: row.id,
						data: { row }
					});*/
				}
				return t_new_items;
			},
			function createListItem(t_item, t_before) {
				let t_old_range_1 = t_push_range(t_item, true);
				const t_fragment_1 = t_fragment(t_fragments, 1, ` <tr> <td class="col-md-1">#</td> <td class="col-md-4"> <a>#</a> </td> <td class="col-md-1"> <a> <span class="glyphicon glyphicon-remove" aria-hidden="true"></span> </a> </td> <td class="col-md-6"></td> </tr> `);
				const t_root_1 = t_root(t_fragment_1);
				const t_tr_1 = t_next(t_root_1) as HTMLElement;
				const t_text_1 = t_child(t_next(t_child(t_tr_1)));
				const t_a_1 = t_next(t_child(t_next(t_next(t_next(t_child(t_tr_1)))))) as HTMLElement;
				const t_text_2 = t_child(t_a_1);
				const t_a_2 = t_next(t_child(t_next(t_next(t_next(t_next(t_next(t_child(t_tr_1)))))))) as HTMLElement;
				const t_text_3 = t_next(t_tr_1);
				$run(function setClassList() {
					t_tr_1.classList.toggle("selected", $state.selected === t_item.data.row.id);
				});
				$run(function setTextContent() {
					t_text_1.textContent = t_fmt(t_item.data.row.id);
				});
				t_event(t_a_1, "click", () => $state.selected = t_item.data.row.id);
				$run(function setTextContent() {
					t_text_2.textContent = ` ${t_fmt(t_item.data.row.label)} `;
				});
				t_event(t_a_2, "click", () => remove(t_item.data.row));
				t_add_fragment(t_fragment_1, t_for_parent_1, t_before);
				t_next(t_text_3);
				t_pop_range(t_old_range_1);
			}
		);


		t_apply_props(t_div_1, $props, []);
		t_event(t_button_1, "click", create);
		t_event(t_button_2, "click", createLots);
		t_event(t_button_3, "click", append);
		t_event(t_button_4, "click", partialUpdate);
		t_event(t_button_5, "click", clear);
		t_event(t_button_6, "click", swapRows);
		t_add_fragment(t_fragment_0, $parent, $anchor);
	}
}

export default Bench;
