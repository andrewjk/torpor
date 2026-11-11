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

// ── Deterministic shuffle machinery (BYTE-IDENTICAL across all bench
// fixtures, replayed by run.mjs for the reorder ops' identity gate): every
// #shuffle click derives a fresh 32-bit seed from a module-level mulberry32
// stream with a FIXED seed (42), then runs Fisher–Yates with a PRNG seeded by
// it. The harness replays the same stream, so it can predict every shuffle
// result for the identity gate.
function mulberry32(seed) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}
const SHUFFLE_SEED = 42;
const shuffleSeeds = mulberry32(SHUFFLE_SEED);
const nextShuffleSeed = () => (shuffleSeeds() * 4294967296) >>> 0;
function shuffleWithSeed(d, seed) {
	const rand = mulberry32(seed);
	const out = d.slice();
	for (let i = out.length - 1; i > 0; i--) {
		const j = (rand() * (i + 1)) | 0;
		const tmp = out[i];
		out[i] = out[j];
		out[j] = tmp;
	}
	return out;
}

// ── Keyed-reorder matrix. Each op replaces the rows signal with a fresh
// array built from the CURRENT one (never in-place) — the permuted array
// reuses the same row objects so <For> moves nodes instead of rebuilding.
const reverseRows = () => commit((d) => d.toReversed());
const shuffleRows = () => {
	// Seed drawn HERE (once per click) — keeps the stream in lockstep with
	// the harness's replayed stream.
	const seed = nextShuffleSeed();
	commit((d) => shuffleWithSeed(d, seed));
};
const rotateForward = () =>
	commit((d) => (d.length === 0 ? d : [d[d.length - 1], ...d.slice(0, -1)]));
const rotateBackward = () => commit((d) => (d.length === 0 ? d : [...d.slice(1), d[0]]));
const prepend100 = () => commit((d) => buildData(100).concat(d));
const append100 = () => commit((d) => d.concat(buildData(100)));
const insertMid100 = () =>
	commit((d) => {
		const mid = d.length >> 1;
		return d.slice(0, mid).concat(buildData(100), d.slice(mid));
	});
const removeFirst = () => commit((d) => d.slice(1));
const removeEvery10 = () => commit((d) => d.filter((_, i) => i % 10 !== 0));
// displace_k: move the FIRST k rows (as a group, order preserved) to the END.
const displace = (k) => commit((d) => d.slice(k).concat(d.slice(0, k)));

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
						<div class="row">
							<Button id="reverse" title="Reverse rows" cb={reverseRows} />
							<Button id="shuffle" title="Shuffle rows (seeded)" cb={shuffleRows} />
							<Button id="rotatef" title="Rotate last to front" cb={rotateForward} />
							<Button id="rotateb" title="Rotate first to end" cb={rotateBackward} />
							<Button id="prepend100" title="Prepend 100 rows" cb={prepend100} />
							<Button id="append100" title="Append 100 rows" cb={append100} />
							<Button id="insertmid100" title="Insert 100 rows at middle" cb={insertMid100} />
							<Button id="removefirst" title="Remove first row" cb={removeFirst} />
							<Button id="removeevery10" title="Remove every 10th row" cb={removeEvery10} />
							<Button id="displace3" title="Displace first 3 to end" cb={() => displace(3)} />
							<Button id="displace4" title="Displace first 4 to end" cb={() => displace(4)} />
							<Button id="displace5" title="Displace first 5 to end" cb={() => displace(5)} />
							<Button id="displace6" title="Displace first 6 to end" cb={() => displace(6)} />
							<Button id="displace8" title="Displace first 8 to end" cb={() => displace(8)} />
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
