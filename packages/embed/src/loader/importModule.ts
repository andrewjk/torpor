/**
 * The default module loader: imports the code as a blob module, which the
 * browser resolves with its own module system (an import map on the host
 * page resolves bare specifiers; rewritten absolute URLs resolve directly).
 */
export default function importModule(code: string): Promise<{ default: unknown }> {
	const url = URL.createObjectURL(new Blob([code], { type: "text/javascript" }));
	return import(url).finally(() => URL.revokeObjectURL(url));
}
