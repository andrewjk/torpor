#! /usr/bin/env node
import { start } from "../index";

// Editors launch the server with an explicit transport argument
// (--node-ipc, --stdio or --socket={number}). Default to stdio, so that the
// server can be used by any editor or LSP client.
const args = process.argv.slice(2);
if (!args.some((arg) => arg === "--stdio" || arg === "--node-ipc" || arg.startsWith("--socket"))) {
	process.argv.push("--stdio");
}

start();
