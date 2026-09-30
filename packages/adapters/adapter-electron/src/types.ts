/**
 * A serializable subset of Electron's `BrowserWindowConstructorOptions`.
 * Only values that survive a JSON round-trip can be used, because the options
 * are written to `dist/electron/electron.json` at build time and read by the
 * Electron main process at launch.
 */
export interface ElectronWindowOptions {
	width?: number;
	height?: number;
	minWidth?: number;
	minHeight?: number;
	maxWidth?: number;
	maxHeight?: number;
	title?: string;
	backgroundColor?: string;
	show?: boolean;
	resizable?: boolean;
	fullscreen?: boolean;
	fullscreenable?: boolean;
	autoHideMenuBar?: boolean;
	alwaysOnTop?: boolean;
	transparent?: boolean;
}

export interface ElectronOptions {
	/**
	 * Options merged into every `new BrowserWindow(...)`. The adapter's own
	 * secure defaults (`contextIsolation`, `sandbox`, no `nodeIntegration`)
	 * always win over `webPreferences` passed here, which cannot be set.
	 */
	window?: ElectronWindowOptions;
	/**
	 * The Electron session partition used for the window, e.g.
	 * `session.fromPartition(partition)`. Defaults to `"persist:torpor"`, so
	 * cookies -- including Torpor's signed session cookie -- and web storage
	 * survive restarts. Use a name without the `persist:` prefix for an
	 * in-memory partition, or any other name to isolate profiles/users.
	 */
	partition?: string;
	/**
	 * The host the loopback HTTP server binds to. Defaults to `127.0.0.1`.
	 * Binding to anything else exposes the app's server to the network.
	 */
	host?: string;
	/**
	 * The port for the loopback HTTP server. Defaults to `0` (an ephemeral
	 * port, chosen by the OS).
	 *
	 * Cookies are scoped to the host, not the port, so sessions persist across
	 * launches regardless. Web storage (`localStorage`, `IndexedDB`) *is*
	 * origin-scoped, though, so pin a stable port if the app relies on it
	 * staying put between launches.
	 */
	port?: number;
	/**
	 * Set to `false` to skip auto-launching an Electron window in dev, leaving
	 * `tb --dev` to serve the app in the browser.
	 */
	dev?: boolean;
}

export interface StartServerOptions {
	host?: string;
	port?: number;
}

export interface RunningServer {
	/** The `http://host:port` origin the window should load. */
	url: string;
	host: string;
	port: number;
	/** Stops the loopback server. */
	close: () => Promise<void>;
}
