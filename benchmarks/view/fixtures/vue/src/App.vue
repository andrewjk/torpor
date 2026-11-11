<script setup>
	import { ref, shallowRef } from 'vue';

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

	const selected = ref(0);
	const rows = shallowRef([]);

	function commit(update, nextSelected) {
		rows.value = typeof update === 'function' ? update(rows.value) : update;
		selected.value = nextSelected ?? selected.value;
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
	const select = (id) => (selected.value = id);
	const remove = (id) =>
		commit((data) => data.filter((row) => row.id !== id));

	// ── Deterministic shuffle machinery (BYTE-IDENTICAL across all bench
	// fixtures, replayed by run.mjs for the reorder ops' identity gate) ──────
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

	// ── Keyed-reorder matrix. Each op replaces the rows ref with a fresh
	// array built from the CURRENT one (never in-place).
	const reverseRows = () => (rows.value = rows.value.toReversed());
	const shuffleRows = () => {
		// Seed drawn HERE (once per click) — keeps the stream in lockstep with
		// the harness's replayed stream.
		const seed = nextShuffleSeed();
		rows.value = shuffleWithSeed(rows.value, seed);
	};
	const rotateForward = () => {
		const d = rows.value;
		rows.value = d.length === 0 ? d : [d[d.length - 1], ...d.slice(0, -1)];
	};
	const rotateBackward = () => {
		const d = rows.value;
		rows.value = d.length === 0 ? d : [...d.slice(1), d[0]];
	};
	const prepend100 = () => (rows.value = buildData(100).concat(rows.value));
	const append100 = () => (rows.value = rows.value.concat(buildData(100)));
	const insertMid100 = () => {
		const d = rows.value;
		const mid = d.length >> 1;
		rows.value = d.slice(0, mid).concat(buildData(100), d.slice(mid));
	};
	const removeFirst = () => (rows.value = rows.value.slice(1));
	const removeEvery10 = () => (rows.value = rows.value.filter((_, i) => i % 10 !== 0));
	// displace_k: move the FIRST k rows (as a group, order preserved) to the END.
	const displace = (k) => {
		const d = rows.value;
		rows.value = d.slice(k).concat(d.slice(0, k));
	};
</script>

<template>
	<div class="container">
		<div class="jumbotron">
			<div class="row">
				<div class="col-md-6"><h1>Vue keyed</h1></div>
				<div class="col-md-6">
					<div class="row">
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="run" @click="run">
								Create 1,000 rows
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="runlots" @click="runLots">
								Create 10,000 rows
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="add" @click="add">
								Append 1,000 rows
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="update" @click="update">
								Update every 10th row
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="clear" @click="clear">
								Clear
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="swaprows"
								@click="swapRows"
							>
								Swap Rows
							</button>
						</div>
					</div>
					<div class="row">
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="reverse" @click="reverseRows">
								Reverse rows
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="shuffle" @click="shuffleRows">
								Shuffle rows (seeded)
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="rotatef" @click="rotateForward">
								Rotate last to front
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="rotateb" @click="rotateBackward">
								Rotate first to end
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="prepend100" @click="prepend100">
								Prepend 100 rows
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="append100" @click="append100">
								Append 100 rows
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="insertmid100" @click="insertMid100">
								Insert 100 rows at middle
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="removefirst" @click="removeFirst">
								Remove first row
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="removeevery10" @click="removeEvery10">
								Remove every 10th row
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="displace3" @click="displace(3)">
								Displace first 3 to end
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="displace4" @click="displace(4)">
								Displace first 4 to end
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="displace5" @click="displace(5)">
								Displace first 5 to end
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="displace6" @click="displace(6)">
								Displace first 6 to end
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="displace8" @click="displace(8)">
								Displace first 8 to end
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
		<table class="table table-hover table-striped test-data">
			<tbody>
				<tr v-for="row of rows" :key="row.id" :class="{ danger: row.id === selected }">
					<td class="col-md-1">{{ row.id }}</td>
					<td class="col-md-4">
						<a @click="select(row.id)">{{ row.label }}</a>
					</td>
					<td class="col-md-1">
						<a @click="remove(row.id)">
							<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
						</a>
					</td>
					<td class="col-md-6"></td>
				</tr>
			</tbody>
		</table>
		<span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
	</div>
</template>
