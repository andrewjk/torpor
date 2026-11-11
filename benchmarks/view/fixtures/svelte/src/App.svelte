<script>
	import { flushSync } from 'svelte';

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

	let rows = $state.raw([]);
	let selected = $state(0);

	function commit(update, nextSelected = selected) {
		flushSync(() => {
			rows = typeof update === 'function' ? update(rows) : update;
			selected = nextSelected;
		});
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
	const select = (id) => flushSync(() => (selected = id));
	const remove = (id) => commit((data) => data.filter((row) => row.id !== id));

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

	// ── Keyed-reorder matrix. Each op replaces the rows state with a fresh
	// array built from the CURRENT one (never in-place).
	const reverse = () => commit((data) => data.toReversed());
	const shuffle = () => {
		const seed = nextShuffleSeed();
		commit((data) => shuffleWithSeed(data, seed));
	};
	const rotateForward = () =>
		commit((data) => (data.length ? [data[data.length - 1], ...data.slice(0, -1)] : data));
	const rotateBackward = () => commit((data) => (data.length ? [...data.slice(1), data[0]] : data));
	const prepend100 = () => commit((data) => buildData(100).concat(data));
	const append100 = () => commit((data) => data.concat(buildData(100)));
	const insertMid100 = () =>
		commit((data) => {
			const mid = data.length >> 1;
			return data.slice(0, mid).concat(buildData(100), data.slice(mid));
		});
	const removeFirst = () => commit((data) => data.slice(1));
	const removeEvery10 = () => commit((data) => data.filter((_, index) => index % 10 !== 0));
	// displace_k: move the FIRST k rows (as a group, order preserved) to the END.
	const displace = (count) => commit((data) => data.slice(count).concat(data.slice(0, count)));
</script>

<div class="container">
	<div class="jumbotron">
		<div class="row">
			<div class="col-md-6"><h1>Svelte 5 keyed</h1></div>
			<div class="col-md-6">
				<div class="row">
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="run" onclick={run}>
							Create 1,000 rows
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="runlots" onclick={runLots}>
							Create 10,000 rows
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="add" onclick={add}>
							Append 1,000 rows
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="update" onclick={update}>
							Update every 10th row
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button type="button" class="btn btn-primary btn-block" id="clear" onclick={clear}>
							Clear
						</button>
					</div>
					<div class="col-sm-6 smallpad">
						<button
							type="button"
							class="btn btn-primary btn-block"
							id="swaprows"
							onclick={swapRows}
						>
							Swap Rows
						</button>
					</div>
					<div class="row">
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="reverse" onclick={reverse}>
								Reverse rows
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="shuffle" onclick={shuffle}>
								Shuffle rows (seeded)
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="rotatef" onclick={rotateForward}>
								Rotate last to front
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="rotateb" onclick={rotateBackward}>
								Rotate first to end
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="prepend100" onclick={prepend100}>
								Prepend 100 rows
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button type="button" class="btn btn-primary btn-block" id="append100" onclick={append100}>
								Append 100 rows
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="insertmid100"
								onclick={insertMid100}
							>
								Insert 100 rows at middle
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="removefirst"
								onclick={removeFirst}
							>
								Remove first row
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="removeevery10"
								onclick={removeEvery10}
							>
								Remove every 10th row
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="displace3"
								onclick={() => displace(3)}
							>
								Displace first 3 to end
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="displace4"
								onclick={() => displace(4)}
							>
								Displace first 4 to end
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="displace5"
								onclick={() => displace(5)}
							>
								Displace first 5 to end
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="displace6"
								onclick={() => displace(6)}
							>
								Displace first 6 to end
							</button>
						</div>
						<div class="col-sm-6 smallpad">
							<button
								type="button"
								class="btn btn-primary btn-block"
								id="displace8"
								onclick={() => displace(8)}
							>
								Displace first 8 to end
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<table class="table table-hover table-striped test-data">
		<tbody>
			{#each rows as item (item.id)}
				<tr class:danger={selected === item.id}>
					<td class="col-md-1">{item.id}</td>
					<td class="col-md-4">
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<a onclick={() => select(item.id)}>{item.label}</a>
					</td>
					<td class="col-md-1">
						<!-- svelte-ignore a11y_click_events_have_key_events -->
						<!-- svelte-ignore a11y_no_static_element_interactions -->
						<a onclick={() => remove(item.id)}>
							<span class="glyphicon glyphicon-remove" aria-hidden="true"></span>
						</a>
					</td>
					<td class="col-md-6"></td>
				</tr>
			{/each}
		</tbody>
	</table>
	<span class="preloadicon glyphicon glyphicon-remove" aria-hidden="true"></span>
</div>
