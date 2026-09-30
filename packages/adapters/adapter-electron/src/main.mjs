// This file is copied into <site>/dist/electron by @torpor/adapter-electron.
// It serves the built site over a loopback HTTP server and shows it in a
// BrowserWindow. Requests run here, in the main process, so cookies, sessions
// and redirects behave exactly as on a Node server.
import { app, BrowserWindow, session, shell } from "electron";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "@torpor/adapter-electron/runtime";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(dir, "..", "..");
const config = JSON.parse(readFileSync(path.join(dir, "electron.json"), "utf-8"));
const partition = config.partition ?? "persist:torpor";

let server;
let origin = "";

async function createWindow() {
	const win = new BrowserWindow({
		width: 1100,
		height: 800,
		show: false,
		backgroundColor: "#ffffff",
		...config.window,
		webPreferences: {
			preload: path.join(dir, "preload.cjs"),
			contextIsolation: true,
			nodeIntegration: false,
			sandbox: true,
			session: session.fromPartition(partition),
		},
	});

	// Open external links in the user's browser; deny everything else
	win.webContents.setWindowOpenHandler(({ url }) => {
		if (/^https?:/.test(url) && !url.startsWith(origin)) void shell.openExternal(url);
		return { action: "deny" };
	});

	win.once("ready-to-show", () => win.show());
	await win.loadURL(`${server.url}/`);
}

app
	.whenReady()
	.then(async () => {
		server = await startServer(root, { host: config.host, port: config.port });
		origin = server.url;
		await createWindow();

		app.on("activate", () => {
			if (BrowserWindow.getAllWindows().length === 0) void createWindow();
		});
	})
	.catch((error) => {
		console.error("[torpor] Failed to start:", error);
		app.quit();
	});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

// Flush cookies (so the session survives) and stop the server before quitting
let shuttingDown = false;
app.on("before-quit", (event) => {
	if (shuttingDown) return;
	event.preventDefault();
	shuttingDown = true;
	void Promise.all([
		session.fromPartition(partition).cookies.flushStore(),
		server?.close(),
	]).finally(() => app.quit());
});
