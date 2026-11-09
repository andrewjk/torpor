/**
 * The submissions store — site storage for anything an embedded app submits
 * through the bridge (a suggested word, a guestbook signature, …). A JSON
 * file here; a real site would use its database.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export interface Submission {
	app: string;
	text: string;
	at: string;
}

const FILE = path.join(process.cwd(), "submissions.json");
const MAX_TEXT = 200;

export function listSubmissions(): Submission[] {
	if (!existsSync(FILE)) return [];
	try {
		return (JSON.parse(readFileSync(FILE, "utf8")) as Submission[]).reverse();
	} catch {
		return [];
	}
}

/** Validates and appends one submission; returns the stored entry */
export function addSubmission(input: { app?: unknown; text?: unknown }): Submission {
	const app = typeof input?.app === "string" ? input.app.slice(0, 40) : "unknown";
	const text = typeof input?.text === "string" ? input.text.trim().slice(0, MAX_TEXT) : "";
	if (text === "") {
		throw new Error("A submission needs some text.");
	}
	const entry: Submission = { app, text, at: new Date().toISOString() };
	const all = listSubmissions().reverse();
	all.push(entry);
	writeFileSync(FILE, JSON.stringify(all, null, 2) + "\n");
	return entry;
}
