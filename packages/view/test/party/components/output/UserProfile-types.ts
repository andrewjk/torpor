import type SlotRender from "../../../../src/types/SlotRender";

declare function UserProfile(
	$parent: ParentNode,
	$anchor: Node | null,
	$props: {
		name: string,
		age: number,
		favoriteColors: string[],
		isAvailable: boolean
	},
	$context?: Record<PropertyKey, any>,
	$slots?: Record<string, SlotRender>,
): void;
export default UserProfile;
