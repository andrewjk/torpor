import { TextDocument } from "vscode-languageserver-textdocument";
import {
	CompletionList,
	Diagnostic,
	InitializeParams,
	ProposedFeatures,
	SemanticTokensRangeRequest,
	SemanticTokensRequest,
	TextDocumentSyncKind,
	TextDocuments,
	createConnection,
} from "vscode-languageserver/node.js";
//import { getSemanticTokensLegend } from "./getSemanticTokensLegend";
import { LanguageModes, getLanguageModes } from "./languageModes";
import {
	getDocumentSymbols,
	getImplementation,
	getSelectionRanges,
	getSemanticTokens,
} from "./modes/scriptMode";

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
			completionProvider: {
				resolveProvider: false,
				triggerCharacters: [".", "$"],
				completionItem: {
					labelDetailsSupport: true,
				},
			},
			codeActionProvider: true,
			hoverProvider: true,
			definitionProvider: true,
			implementationProvider: true,
			// HACK: Implemented these while trying to get `$` completion working
			// They will probably be required at some stage, when I figure out what they are for
			//documentSymbolProvider: true,
			//selectionRangeProvider: true,
			//semanticTokensProvider: {
			//	legend: getSemanticTokensLegend(),
			//	range: true,
			//	full: true,
			//},
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

connection.onCompletion(async (evt, _cancellationToken) => {
	const document = documents.get(evt.textDocument.uri);
	if (!document) {
		return null;
	}

	const mode = languageModes.getModeAtPosition(document, evt.position);
	if (!mode || !mode.doComplete) {
		return CompletionList.create();
	}

	return mode.doComplete(document, evt.position, evt.context);
});

connection.onCodeAction(async (evt, _cancellationToken) => {
	const document = documents.get(evt.textDocument.uri);
	if (!document) {
		return null;
	}

	// HACK: Just checking the mode at the start
	const mode = languageModes.getModeAtPosition(document, evt.range.start);
	if (!mode || !mode.doCodeAction) {
		return null;
	}

	return mode.doCodeAction(document, evt.range, evt.context);
});

connection.onHover(async (evt, _cancellationToken) => {
	const document = documents.get(evt.textDocument.uri);
	if (!document) {
		return null;
	}

	const mode = languageModes.getModeAtPosition(document, evt.position);
	if (!mode || !mode.doHover) {
		return null;
	}

	return mode.doHover(document, evt.position);
});

connection.onDefinition(async (evt, _cancellationToken) => {
	const document = documents.get(evt.textDocument.uri);
	if (!document) {
		return null;
	}

	const mode = languageModes.getModeAtPosition(document, evt.position);
	if (!mode || !mode.doDefinition) {
		return null;
	}

	return mode.doDefinition(document, evt.position);
});

connection.onDocumentSymbol((evt, cancellationToken) => {
	const document = documents.get(evt.textDocument.uri);
	if (!document) {
		return null;
	}
	return getDocumentSymbols(document, cancellationToken);
});

connection.onImplementation((evt, cancellationToken) => {
	const document = documents.get(evt.textDocument.uri);
	if (!document) {
		return null;
	}
	return getImplementation(document, evt.position, cancellationToken);
});

connection.onSelectionRanges((evt, cancellationToken) => {
	const document = documents.get(evt.textDocument.uri);
	if (!document) {
		return null;
	}
	return getSelectionRanges(document, evt.positions, cancellationToken);
});

connection.onRequest(SemanticTokensRequest.method, (evt, cancellationToken) => {
	const document = documents.get(evt.textDocument.uri);
	if (!document) {
		return null;
	}
	return getSemanticTokens(document, undefined, cancellationToken);
});

connection.onRequest(SemanticTokensRangeRequest.method, (evt, cancellationToken) => {
	const document = documents.get(evt.textDocument.uri);
	if (!document) {
		return null;
	}
	return getSemanticTokens(document, evt.range, cancellationToken);
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
