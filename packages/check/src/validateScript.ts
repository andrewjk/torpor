import { loadDocument } from "./loadDocument";
import processErrors from "./processErrors";
import type Diagnostic from "./types/Diagnostic";

export default function validateScript(filename: string): Diagnostic[] {
	try {
		const transformed = loadDocument(filename);
		if (!transformed.ok) {
			// If there were parse or build errors, return them immediately
			// TODO: Do we want to clear the virtual file??
			if (!transformed.ok) {
				return transformed.errors;
			}
		}

		const { key, vts } = transformed;

		// HACK: Is this ok to do every check? We're doing it because otherwise
		// changes to linked files (e.g. adding or removing a field in an interface)
		// don't get picked up. But doing it here also means that it only happens
		// when the file is edited...
		vts.lang.cleanupSemanticCache();

		const diagnostics = processErrors(vts, [
			...vts.lang.getSyntacticDiagnostics(key),
			...vts.lang.getSemanticDiagnostics(key),
		]);

		return diagnostics;
	} catch (ex) {
		console.log("VALIDATE ERROR:", ex);
		return [];
	}
}
