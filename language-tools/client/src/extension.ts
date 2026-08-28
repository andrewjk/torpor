import * as path from "path";
import { ExtensionContext } from "vscode";
import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
	TransportKind,
} from "vscode-languageclient/node";

let client: LanguageClient | undefined;

export function activate(context: ExtensionContext) {
	// The server is bundled into dist by scripts/build.ts
	const serverModule = context.asAbsolutePath(path.join("dist", "server.js"));

	// If the extension is launched in debug mode then the debug server options
	// are used. Otherwise the run options are used.
	const serverOptions: ServerOptions = {
		run: { module: serverModule, transport: TransportKind.ipc },
		debug: {
			module: serverModule,
			transport: TransportKind.ipc,
			options: { execArgv: ["--nolazy", "--inspect=6009"] },
		},
	};

	// Options to control the language client
	const clientOptions: LanguageClientOptions = {
		// Register the server for .torp documents (defined in the package.json)
		documentSelector: [{ scheme: "file", language: "torpor" }],
	};

	// Create the language client
	client = new LanguageClient(
		"torporLanguageClient",
		"Torpor Language Client",
		serverOptions,
		clientOptions,
	);

	// Start the client. This will also launch the server
	void client.start();
}

export function deactivate(): Thenable<void> | undefined {
	if (!client) {
		return undefined;
	}
	return client.stop();
}
