import type SlotRender from "../../../../src/types/SlotRender";

declare function TextValues(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: { str: string; num: number; bool: boolean; nullVal: null; undefVal: undefined; zero: number; negNum: number; nan: number },
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default TextValues;
