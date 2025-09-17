import context from "./context";

// Not sure if this is a good idea?

export default function $peek<T>(fn: () => T): T {
	const oldActiveTarget = context.activeTarget;
	context.activeTarget = null;

	const result = fn();

	context.activeTarget = oldActiveTarget;

	return result;
}
