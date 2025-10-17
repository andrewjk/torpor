import type Range from "../../types/Range";

export default interface DevContext {
	enabled: boolean;
	boundaries: string[];

	// Hooks
	onRangePushed: (_: Range) => void;
	onRangeCleared: (_: Range) => void;
}
