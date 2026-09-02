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
