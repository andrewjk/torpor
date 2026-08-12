import context from "./context";

/**
 * Snapshots the hydration cursor so a `@try` branch's partial hydration walk
 * can be rewound if the branch throws and the `@catch` branch renders instead.
 *
 * @returns The current hydration cursor node, or `null` when not hydrating.
 */
export default function saveHydration(): ChildNode | null {
	return context.hydrationNode;
}
