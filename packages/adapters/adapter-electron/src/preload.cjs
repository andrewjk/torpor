// Runs in an isolated world before the page loads. Keep this surface as small
// as possible, and never expose Node or Electron modules to the renderer.
const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
	platform: process.platform,
	versions: {
		chrome: process.versions.chrome,
		electron: process.versions.electron,
		node: process.versions.node,
	},
});
