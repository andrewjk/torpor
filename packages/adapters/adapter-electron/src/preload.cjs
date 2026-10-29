// Runs in an isolated world before the page loads. Keep this surface as small
// as possible, and never expose Node or Electron modules to the renderer.
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
	platform: process.platform,
	versions: {
		chrome: process.versions.chrome,
		electron: process.versions.electron,
		node: process.versions.node,
	},
	/**
	 * Sets the native theme mode: `"system"` (follow the OS), `"light"` or
	 * `"dark"`. Affects the window chrome (title bar, dialogs); styling the
	 * app's own content stays the renderer's job.
	 */
	setNativeTheme(mode) {
		return ipcRenderer.invoke("torpor:set-native-theme", mode);
	},
});
