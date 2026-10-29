// This file is copied into <site>/dist/electron by @torpor/adapter-electron.
// It serves the built site over a loopback HTTP server and shows it in a
// BrowserWindow. Requests run here, in the main process, so cookies, sessions
// and redirects behave exactly as on a Node server.
import { app, BrowserWindow, dialog, ipcMain, nativeTheme, session, shell } from "electron";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { startServer } from "@torpor/adapter-electron/runtime";

const dir = path.dirname(fileURLToPath(import.meta.url));
// This file is copied to <output>/electron, so the build output folder is its
// parent (the layout no longer assumes the folder is named "dist")
const output = path.resolve(dir, "..");
const config = JSON.parse(readFileSync(path.join(dir, "electron.json"), "utf-8"));
const partition = config.partition ?? "persist:torpor";
const theme = config.theme ?? "system";

let server;
let origin = "";

async function createWindow() {
	// Follow the app's theme before the window is created, and pick a
	// background color that matches it: avoids a white flash in dark mode
	// before the renderer's stylesheet applies
	nativeTheme.themeSource = theme;
	const backgroundColor =
		config.window?.backgroundColor ?? (nativeTheme.shouldUseDarkColors ? "#000000" : "#ffffff");

	const win = new BrowserWindow({
		width: 1100,
		height: 800,
		show: false,
		backgroundColor,
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

	// A renderer `beforeunload` handler that prevents unload would otherwise
	// leave the window permanently unclosable: Electron suppresses Chromium's
	// "leave site?" prompt, so ask about it here instead
	win.webContents.on("will-prevent-unload", (event) => {
		const choice = dialog.showMessageBoxSync(win, {
			type: "warning",
			buttons: ["Discard changes", "Cancel"],
			defaultId: 1,
			cancelId: 1,
			message: "Unsaved Changes",
			detail: "There are unsaved changes on this page. What would you like to do with them?",
		});
		if (choice === 0) event.preventDefault(); // allow the unload
	});

	win.once("ready-to-show", () => win.show());
	await win.loadURL(`${server.url}/`);
}

app
	.whenReady()
	.then(async () => {
		// Runtime theme changes from the renderer
		// (`window.electronAPI.setNativeTheme(mode)` in the preload)
		ipcMain.handle("torpor:set-native-theme", (_event, mode) => {
			if (mode === "system" || mode === "light" || mode === "dark") {
				nativeTheme.themeSource = mode;
			}
		});

		server = await startServer(output, { host: config.host, port: config.port });
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

// Flush cookies (so the session survives) and stop the server before quitting.
// A stuck flush or socket must never stop the app from quitting, so the
// shutdown work is raced against a short timeout
let shuttingDown = false;
app.on("before-quit", (event) => {
	if (shuttingDown) return;
	event.preventDefault();
	shuttingDown = true;

	let timer;
	const timeout = new Promise((resolve) => {
		timer = setTimeout(resolve, 1500);
	});
	void Promise.race([
		Promise.all([session.fromPartition(partition).cookies.flushStore(), server?.close()]),
		timeout,
	])
		.catch(() => {})
		.finally(() => {
			clearTimeout(timer);
			app.quit();
		});
});
