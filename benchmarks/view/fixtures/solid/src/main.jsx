import { createSignal, For } from 'solid-js';
import { render } from 'solid-js/web';

// Solid keyed js-framework-benchmark fixture. Solid 1.9 batches updates inside
// event handlers and commits synchronously when the handler completes, i.e.
// still inside the timed click dispatch — no explicit flush needed.

const A = [
	'pretty', 'large', 'big', 'small', 'tall', 'short', 'long', 'handsome',
	'plain', 'quaint', 'clean', 'elegant', 'easy', 'angry', 'crazy', 'helpful',
	'mushy', 'odd', 'unsightly', 'adorable', 'important', 'inexpensive',
	'cheap', 'expensive', 'fancy',
];
const C = [
	'red', 'yellow', 'blue', 'green', 'pink', 'brown', 'purple', 'brown',
	'white', 'black', 'orange',
];
const N = [
	'table', 'chair', 'house', 'bbq', 'desk', 'car', 'pony', 'cookie',
	'sandwich', 'burger', 'pizza', 'mouse', 'keyboard',
];

let nextId = 1;
const random = (max) => (Math.random() * max) | 0;

function buildData(count) {
	const data = new Array(count);
	for (let i = 0; i < count; i++) {
		data[i] = {
			id: nextId++,
			label: `${A[random(A.length)]} ${C[random(C.length)]} ${N[random(N.length)]}`,
		};
	}
	return data;
}

const [rows, setRows] = createSignal([]);
const [selected, setSelected] = createSignal(0);

function commit(update, nextSelected = selected()) {
	setRows(typeof update === 'function' ? update(rows()) : update);
	setSelected(nextSelected);
}

const run = () => commit(buildData(1000), 0);
const runLots = () => commit(buildData(10000), 0);
const add = () => commit((data) => data.concat(buildData(1000)));
const update = () =>
	commit((data) => {
		const out = data.slice();
		for (let i = 0; i < out.length; i += 10) {
			const row = out[i];
			out[i] = { id: row.id, label: row.label + ' !!!' };
		}
		return out;
	});
const clear = () => commit([], 0);
const swapRows = () =>
	commit((data) => {
		if (data.length <= 998) return data;
		const out = data.slice();
		const tmp = out[1];
		out[1] = out[998];
		out[998] = tmp;
		return out;
	});
const select = (id) => setSelected(id);
const remove = (id) => commit((data) => data.filter((row) => row.id !== id));

const Row = (props) => (
	<tr class={props.selected ? 'danger' : ''}>
		<td class="col-md-1">{props.item.id}</td>
		<td class="col-md-4">
			<a onClick={() => select(props.item.id)}>{props.item.label}</a>
		</td>
		<td class="col-md-1">
			<a onClick={() => remove(props.item.id)}>
				<span class="glyphicon glyphicon-remove" aria-hidden="true" />
			</a>
		</td>
		<td class="col-md-6" />
	</tr>
);

const Button = (props) => (
	<div class="col-sm-6 smallpad">
		<button type="button" class="btn btn-primary btn-block" id={props.id} onClick={props.cb}>
			{props.title}
		</button>
	</div>
);

render(
	() => (
		<div class="container">
			<div class="jumbotron">
				<div class="row">
					<div class="col-md-6">
						<h1>Solid keyed</h1>
					</div>
					<div class="col-md-6">
						<div class="row">
							<Button id="run" title="Create 1,000 rows" cb={run} />
							<Button id="runlots" title="Create 10,000 rows" cb={runLots} />
							<Button id="add" title="Append 1,000 rows" cb={add} />
							<Button id="update" title="Update every 10th row" cb={update} />
							<Button id="clear" title="Clear" cb={clear} />
							<Button id="swaprows" title="Swap Rows" cb={swapRows} />
						</div>
					</div>
				</div>
			</div>
			<table class="table table-hover table-striped test-data">
				<tbody>
					<For each={rows()}>
						{(item) => <Row item={item} selected={selected() === item.id} />}
					</For>
				</tbody>
			</table>
			<span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true" />
		</div>
	),
	document.getElementById('main'),
);
