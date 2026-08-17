import { $run, $watch } from "@torpor/view";
import { describe, expect, it } from "vite-plus/test";
import { createItemGroup } from "../src/utils/createItemGroup";

interface TestItem {
	index: number;
	value: any;
	active: boolean;
}

describe("createItemGroup", () => {
	it("derives selection from the group value", () => {
		const $state = $watch({ value: "" as any });
		const group = createItemGroup<TestItem>({
			state: $state,
			type: "single",
			selectedProperty: "active",
			allowDeselect: false,
		});

		const item1: TestItem = $watch({ index: -1, value: "1", active: false });
		const item2: TestItem = $watch({ index: -1, value: "2", active: false });
		group.registerItem(item1);
		group.registerItem(item2);

		let shown1: boolean | undefined;
		let shown2: boolean | undefined;
		$run(() => {
			shown1 = item1.active;
		});
		$run(() => {
			shown2 = item2.active;
		});
		expect(shown1).toBe(false);
		expect(shown2).toBe(false);

		group.toggleItem("1");
		expect(shown1).toBe(true);
		expect(shown2).toBe(false);

		group.toggleItem("2");
		expect(shown1).toBe(false);
		expect(shown2).toBe(true);
	});

	it("keeps readers in sync when the value oscillates within a batch", () => {
		// Regression test for the effect queue: a stale props re-push (as the
		// compiler's prop-sync effect does) wipes the value, and a mount-style
		// effect restores it — all within one flush. Effects downstream of a
		// derived ($cache) value must re-run with the restored value, not stay
		// frozen at the intermediate one
		const outer = $watch({ activation: "manual" as string, value: "" as any });

		// Component props proxy, as the compiler creates it, with the
		// all-props sync run
		const props = $watch({ value: outer.value, activation: outer.activation });
		$run(() => {
			props.value = outer.value;
			props.activation = outer.activation;
		});

		// Component state + $bind-style forward/backward sync
		const $state = $watch({ value: "" as any });
		$run(() => {
			const v = props.value;
			if (v !== undefined) $state.value = v;
		});
		let firstBackward = true;
		$run(() => {
			const value = $state.value;
			if (!firstBackward) props.value = value;
			firstBackward = false;
		});

		const group = createItemGroup<TestItem>({
			state: $state,
			type: "single",
			selectedProperty: "active",
			allowDeselect: false,
		});

		const item1: TestItem = $watch({ index: -1, value: "1", active: false });
		const item2: TestItem = $watch({ index: -1, value: "2", active: false });
		group.registerItem(item1);
		group.registerItem(item2);

		let shown1: boolean | undefined;
		let shown2: boolean | undefined;
		$run(() => {
			shown1 = item1.active;
		});
		$run(() => {
			shown2 = item2.active;
		});

		// $mount-style effect: default the value once, re-running reactively
		$run(() => {
			if ($state.value === "" && group.itemStates.length) {
				$state.value = group.itemStates[0].value;
			}
		});
		expect(shown1).toBe(true);
		expect(shown2).toBe(false);

		// Unrelated prop change re-pushes the stale value (""),
		// then the mount effect restores it — in the same flush
		outer.activation = "automatic";
		expect(shown1).toBe(true);
		expect(shown2).toBe(false);

		// A later toggle must still propagate
		$state.value = "2";
		expect(shown1).toBe(false);
		expect(shown2).toBe(true);
	});
});
