// The dev counterpart of main.mjs: opens a window against the Vite dev server
// (which the framework's Node dev plugin serves) instead of a built output, so
// HMR works. Launched by the adapter's dev plugin with TORPOR_ELECTRON_URL set.
import { app, BrowserWindow, session, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const url = process.env.TORPOR_ELECTRON_URL ?? "http://localhost:7059";
const config = process.env.TORPOR_ELECTRON_CONFIG
	? JSON.parse(process.env.TORPOR_ELECTRON_CONFIG)
	: {};
const partition = config.partition ?? "persist:torpor";
const origin = new URL(url).origin;

function createWindow() {
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
	win.webContents.setWindowOpenHandler(({ url: target }) => {
		if (/^https?:/.test(target) && !target.startsWith(origin)) void shell.openExternal(target);
		return { action: "deny" };
	});

	win.once("ready-to-show", () => win.show());
	void loadWithRetry(win);
}

// The dev server may still be starting when Electron launches, so retry
async function loadWithRetry(win) {
	for (let attempt = 0; attempt < 40; attempt++) {
		try {
			await win.loadURL(url);
			return;
		} catch {
			await new Promise((resolve) => setTimeout(resolve, 250));
		}
	}
	console.error(`[torpor] Could not load ${url} in Electron`);
}

app
	.whenReady()
	.then(createWindow)
	.catch((error) => {
		console.error("[torpor] Failed to start:", error);
		app.quit();
	});

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
	if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
