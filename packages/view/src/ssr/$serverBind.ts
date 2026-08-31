/**
 * Server no-op for the client-side `$bind` two-way sync primitive. Two-way
 * binding is a client runtime feature — there are no reactive updates during
 * SSR, so there is nothing to sync. The stub exists so server builds
 * importing `$bind` don't emit a dangling import.
 */
export default function $serverBind(
	_: Record<PropertyKey, any>,
	__: Record<PropertyKey, any> | undefined,
	...___: (string | string[])[]
): void {}
