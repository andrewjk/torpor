// The dev counterpart of main.mjs: opens a window against the Vite dev server
// (which the framework's Node dev plugin serves) instead of a built output, so
// HMR works. Launched by the adapter's dev plugin with TORPOR_ELECTRON_URL set.
import { app, BrowserWindow, dialog, ipcMain, nativeTheme, session, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dir = path.dirname(fileURLToPath(import.meta.url));
const url = process.env.TORPOR_ELECTRON_URL ?? "http://localhost:7059";
const config = process.env.TORPOR_ELECTRON_CONFIG
	? JSON.parse(process.env.TORPOR_ELECTRON_CONFIG)
	: {};
const partition = config.partition ?? "persist:torpor";
const theme = config.theme ?? "system";
const origin = new URL(url).origin;

function createWindow() {
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
	win.webContents.setWindowOpenHandler(({ url: target }) => {
		if (/^https?:/.test(target) && !target.startsWith(origin)) void shell.openExternal(target);
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
	.then(() => {
		// Runtime theme changes from the renderer
		// (`window.electronAPI.setNativeTheme(mode)` in the preload)
		ipcMain.handle("torpor:set-native-theme", (_event, mode) => {
			if (mode === "system" || mode === "light" || mode === "dark") {
				nativeTheme.themeSource = mode;
			}
		});

		return createWindow();
	})
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
