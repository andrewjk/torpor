import $watch from "../../../../src/render/$serverWatch";
import t_fmt from "../../../../src/render/formatText";
import t_class from "../../../../src/render/getClasses";
import { type ServerSlotRender } from "../../../../src/types/ServerSlotRender";

export default function Bench(
	// @ts-ignore
	$props?: Record<PropertyKey, any>,
	// @ts-ignore
	$context?: Record<PropertyKey, any>,
	// @ts-ignore
	$slots?: Record<string, ServerSlotRender>,
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
	const colours = [
		"red",
		"yellow",
		"blue",
		"green",
		"pink",
		"brown",
		"purple",
		"brown",
		"white",
		"black",
		"orange",
	];
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
	let t_body = "";
	t_body += ` <div id="main" class="container"> <div class="jumbotron"> <div class="row"> <div class="col-md-6"> <h1>Torpor (keyed)</h1> </div> <div class="col-md-6"> <div class="row"> <div class="col-sm-6 smallpad"> <button type="button" class="btn btn-primary btn-block" id="create">Create 1,000 rows</button> </div> <div class="col-sm-6 smallpad"> <button type="button" class="btn btn-primary btn-block" id="createlots"> Create 10,000 rows </button> </div> <div class="col-sm-6 smallpad"> <button type="button" class="btn btn-primary btn-block" id="append"> Append 1,000 rows </button> </div> <div class="col-sm-6 smallpad"> <button type="button" class="btn btn-primary btn-block" id="update"> Update every 10th row </button> </div> <div class="col-sm-6 smallpad"> <button type="button" class="btn btn-primary btn-block" id="clear">Clear</button> </div> <div class="col-sm-6 smallpad"> <button type="button" class="btn btn-primary btn-block" id="swaprows">Swap Rows</button> </div> </div> </div> </div> </div> <table class="table table-hover table-striped test-data"> <tbody> <![>`;
	for (let row of $state.data) {
		t_body += `<!^>  <tr class="${t_class({ danger: $state.selected === row.id })}"> <td class="col-md-1">${t_fmt(row.id)}</td> <td class="col-md-4"> <a> ${t_fmt(row.label)} </a> </td> <td class="col-md-1"> <a> <span class="glyphicon glyphicon-remove" aria-hidden="true"></span> </a> </td> <td class="col-md-6"></td> </tr> `;
	}
	t_body += `<!]><!> </tbody> </table> <span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span> </div> `;

	return t_body;
}
