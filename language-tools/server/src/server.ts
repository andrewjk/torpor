import { TextDocument } from "vscode-languageserver-textdocument";
import {
	CompletionList,
	Diagnostic,
	InitializeParams,
	ProposedFeatures,
	TextDocumentSyncKind,
	TextDocuments,
	createConnection,
} from "vscode-languageserver/node.js";
import { LanguageModes, getLanguageModes } from "./languageModes";

// Create a connection for the server. The connection uses Node's IPC as a
// transport. Also include all preview / proposed LSP features
const connection = createConnection(ProposedFeatures.all);

// Create a simple text document manager. The text document manager supports
// full document sync only
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let languageModes: LanguageModes;

connection.onInitialize((_params: InitializeParams) => {
	languageModes = getLanguageModes();

	documents.onDidClose((e) => {
		languageModes.onDocumentRemoved(e.document);
	});
	connection.onShutdown(() => {
		languageModes.dispose();
	});

	return {
		capabilities: {
			textDocumentSync: TextDocumentSyncKind.Full,
			// Tell the client that the server supports code completion
			completionProvider: {
				resolveProvider: false,
				triggerCharacters: ["."],
				completionItem: {
					labelDetailsSupport: true,
				},
			},
			hoverProvider: true,
			definitionProvider: true,
		},
	};
});

connection.onDidChangeConfiguration((_change) => {
	// Revalidate all open text documents
	documents.all().forEach(validateTextDocument);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
	validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument) {
	try {
		const version = textDocument.version;
		const diagnostics: Diagnostic[] = [];
		if (textDocument.languageId === "torpor") {
			const modes = languageModes.getAllModesInDocument(textDocument);
			const latestTextDocument = documents.get(textDocument.uri);
			if (latestTextDocument && latestTextDocument.version === version) {
				// check no new version has come in after in after the async op
				modes.forEach((mode) => {
					if (mode.doValidation) {
						mode.doValidation(latestTextDocument).forEach((d) => {
							diagnostics.push(d);
						});
					}
				});
				connection.sendDiagnostics({ uri: latestTextDocument.uri, diagnostics });
			}
		}
	} catch (e) {
		connection.console.error(`Error while validating ${textDocument.uri}`);
		connection.console.error(String(e));
	}
}

connection.onCompletion(async (textDocumentPosition, _token) => {
	const document = documents.get(textDocumentPosition.textDocument.uri);
	if (!document) {
		return null;
	}

	const mode = languageModes.getModeAtPosition(document, textDocumentPosition.position);
	if (!mode || !mode.doComplete) {
		return CompletionList.create();
	}

	return mode.doComplete(document, textDocumentPosition.position);
});

connection.onHover(async (params) => {
	const document = documents.get(params.textDocument.uri);
	if (!document) {
		return null;
	}

	const mode = languageModes.getModeAtPosition(document, params.position);
	if (!mode || !mode.doHover) {
		return null;
	}

	return mode.doHover(document, params.position);
});

connection.onDefinition(async (params) => {
	const document = documents.get(params.textDocument.uri);
	if (!document) {
		return null;
	}

	const mode = languageModes.getModeAtPosition(document, params.position);
	if (!mode || !mode.doDefinition) {
		return null;
	}

	return mode.doDefinition(document, params.position);
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
