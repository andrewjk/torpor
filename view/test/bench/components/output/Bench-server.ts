import { $watch } from "@tera/view/ssr";
import type ServerSlotRender from "../../../../src/types/ServerSlotRender";

export default function Bench(
	$props?: Record<PropertyKey, any>,
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, ServerSlotRender>
) {
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

	function _random(
		$props?: Record<PropertyKey, any>,
		$context?: Record<PropertyKey, any>,
		$slots?: Record<string, ServerSlotRender>
	) {
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

	return $output;
}
