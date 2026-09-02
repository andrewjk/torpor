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
