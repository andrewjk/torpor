/**
 * The default module loader: imports the code as a blob module, which the
 * browser resolves with its own module system (an import map on the host
 * page resolves bare specifiers; rewritten absolute URLs resolve directly).
 */
export default function importModule(code: string): Promise<{ default: unknown }> {
	const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
	// The URL is created at runtime, so there is nothing for bundlers to
	// analyze — the browser's module system resolves it (import map or
	// absolute URLs). `@vite-ignore` keeps the warning out of host builds.
	return import(/* @vite-ignore */ url).finally(() => URL.revokeObjectURL(url));
}
