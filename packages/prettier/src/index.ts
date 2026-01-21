import { parse as parseTorp } from "@torpor/view/compile";
import * as prettier from "prettier";

export const languages: prettier.SupportLanguage[] = [
	{
		name: "torpor",
		parsers: ["torpor-parser"],
		extensions: [".torp"],
	},
];

export const parsers: Record<string, prettier.Parser> = {
	"torpor-parser": {
		parse,
		astFormat: "torpor-ast",
		locStart,
		locEnd,
	},
};

export const printers: Record<string, prettier.Printer> = {
	"torpor-ast": {
		// @ts-ignore
		print,
	},
};

interface Chunk {
	type: "shell" | "head" | "render" | "style";
	id: string;
	content: string;
	start: number;
	end: number;
	shellStart: number;
	formatted: string;
}

interface TorporNode extends prettier.AST {
	chunks: Chunk[];
}

function parse(text: string, _options: object): TorporNode {
	let chunks: Chunk[] = [];
	for (let i = 0; i < text.length; i++) {
		if (text[i] === "@") {
			if (text.slice(i + 1).startsWith("render")) {
				const chunk = consumeChunk(text, i, "render");
				chunks.push(chunk);
				i = chunk.end - 1;
			} else if (text.slice(i + 1).startsWith("head")) {
				const chunk = consumeChunk(text, i, "head");
				chunks.push(chunk);
				i = chunk.end - 1;
			} else if (text.slice(i + 1).startsWith("style")) {
				const chunk = consumeChunk(text, i, "style");
				chunks.push(chunk);
				i = chunk.end - 1;
			}
		}
	}
	let shell = "";
	for (let i = 0; i < chunks.length; i++) {
		let start = i > 0 ? chunks[i - 1].end : 0;
		chunks[i].shellStart = shell.length;
		shell += text.substring(start, chunks[i].start) + `/* ${chunks[i].id} */ 1;`;
	}
	shell += text.substring(chunks[chunks.length - 1].end);

	return {
		chunks: [
			{
				type: "shell",
				id: "",
				content: shell,
				start: 0,
				end: text.length,
				shellStart: 0,
				formatted: "",
			},
			...chunks,
		],
	};
}

function consumeChunk(text: string, i: number, type: "head" | "render" | "style"): Chunk {
	let level = 0;
	let j;
	for (j = i; j < text.length; j++) {
		if (text[j] === "{") {
			level++;
		} else if (text[j] === "}") {
			level--;
			if (level === 0) break;
		}
	}
	return {
		type,
		id: crypto.randomUUID(),
		content: text.substring(i, j + 1),
		start: i,
		end: j + 1,
		shellStart: 0,
		formatted: "",
	};
}

function locStart(): number {
	return 0;
}

function locEnd(): number {
	return 0;
}

async function print(
	path: prettier.AstPath,
	options: object,
	_print: (path: prettier.AstPath) => prettier.Doc,
): Promise<prettier.Doc> {
	const node = path.node as TorporNode;

	for (let chunk of node.chunks) {
		switch (chunk.type) {
			case "shell": {
				chunk.formatted = await prettier.format(chunk.content, {
					...options,
					parser: "typescript",
				});
				break;
			}
			case "head":
			case "render": {
				chunk.formatted = formatRenderChunk(chunk.type, chunk.content, options);
				break;
			}
			case "style": {
				chunk.formatted = formatStyleChunk(chunk.content, options);
				break;
			}
		}
	}

	const shell = node.chunks[0];

	for (let i = 1; i < node.chunks.length; i++) {
		shell.formatted = shell.formatted.replace(
			// TODO: What if prettier strips semicolons??
			`/* ${node.chunks[i].id} */ 1;`,
			node.chunks[i].formatted.trimStart(),
		);
	}

	return shell.formatted;
}

interface FormatState {
	indent: number;
	output: string;
	preserveWhitespace: any;
}

function formatRenderChunk(type: "head" | "render", content: string, options: object) {
	// HACK: should do this when parsing and convert it into a better AST
	const source = `
export default function C() {
${content}
}`;
	const parsed = parseTorp(source);
	if (!parsed.ok || !parsed.template) {
		console.log(
			`Failed to parse render section: ${parsed.errors.map((e) => e.message).join(", ")}`,
		);
		return content;
	}

	let node =
		type === "head" ? parsed.template.components[0].head : parsed.template.components[0].markup;
	let state: FormatState = {
		// HACK: this should come from the indentation of the @render
		indent: 1,
		output: "",
		preserveWhitespace: false,
	};
	formatRenderNode(node, state, options, type);
	return state.output;
}

// HACK: no types on internal types
function formatRenderNode(
	node: any,
	state: FormatState,
	options: Record<PropertyKey, any>,
	type = "",
) {
	switch (node.type) {
		case "root": {
			formatRootNode(node, state, options, type);
			break;
		}
		case "control": {
			formatControlNode(node, state, options);
			break;
		}
		case "element":
		case "component":
		case "special": {
			formatElementNode(node, state, options);
			break;
		}
		case "text": {
			formatTextNode(node, state, options);
			break;
		}
		case "comment": {
			formatCommentNode(node, state, options);
			break;
		}
		default: {
			throw new Error("Unknown node type: " + node.type);
		}
	}
}

function formatRootNode(
	node: any,
	state: FormatState,
	options: Record<PropertyKey, any>,
	type: string,
) {
	const indent = "\t".repeat(state.indent);
	state.output += `${indent}@${type} {`;
	state.indent++;
	for (let c of node.children) {
		formatRenderNode(c, state, options);
	}
	state.indent--;
	state.output = state.output.replace(/\n\n$/, "\n");
	state.output += `${indent}}`;
}

function formatControlNode(node: any, state: FormatState, options: Record<PropertyKey, any>) {
	const indent = "\t".repeat(state.indent);
	// HACK: might be better to change the way these are parsed out...
	switch (node.operation) {
		case "@if group":
		case "@for group": {
			for (let c of node.children) {
				formatRenderNode(c, state, options);
			}
			state.output = state.output.replace(/\n\n$/, "\n");
			state.output += `${indent}}`;
			break;
		}
		case "@if":
		case "@for": {
			state.output += `${indent}@${node.statement} {`;
			state.indent++;
			for (let c of node.children) {
				formatRenderNode(c, state, options);
			}
			state.indent--;
			break;
		}
		case "@else if":
		case "@else": {
			state.output += `${indent}} ${node.statement} {`;
			state.indent++;
			for (let c of node.children) {
				formatRenderNode(c, state, options);
			}
			state.indent--;
			break;
		}
		case "@switch group": {
			state.output += `${indent}@${node.statement} {`;
			state.indent++;
			for (let c of node.children) {
				formatRenderNode(c, state, options);
			}
			state.indent--;
			state.output = state.output.replace(/\n\n$/, "\n");
			state.output += `${indent}}`;
			break;
		}
		case "@case":
		case "@default": {
			// HACK: need to fix parsing
			if (node.operation === "@default") state.output += "\n";
			state.output += `${indent}${node.statement} {`;
			state.indent++;
			for (let c of node.children) {
				formatRenderNode(c, state, options);
			}
			state.indent--;
			state.output = state.output.replace(/\n\n$/, "\n");
			state.output += `${indent}}`;
			break;
		}
		case "@key": {
			state.output += `${indent}@${node.statement}\n`;
			break;
		}
		default: {
			throw new Error("Unknown control operation: " + node.operation);
		}
	}
}

function formatElementNode(node: any, state: FormatState, options: Record<PropertyKey, any>) {
	const indent = "\t".repeat(state.indent);

	// HACK: Empty <fill> nodes get inserted behind the scenes and shouldn't be output
	if (node.tagName === "filldef") {
		for (let c of node.children) {
			formatRenderNode(c, state, options);
		}
		return;
	}

	// Build the list of attributes
	let attrs = node.attributes.map((a: any) => {
		if (a.value === undefined) {
			return a.name;
		} else if (a.value === a.name || a.value.endsWith(`.${a.name}`)) {
			return `{${a.value}}`;
		} else {
			let value = a.fullyReactive ? `{${a.value}}` : a.value;
			return `${a.name}=${value}`;
		}
	});

	// TODO: Do we need to translate tabs to spaces for print width??
	// Let's see if they work on one line
	let attributes = attrs.length ? " " + attrs.join(" ") : "";
	let element = `${indent}<${node.tagName}${attributes}${node.selfClosed ? " /" : ""}>`;
	if (node.attributes.length && element.length > options.printWidth) {
		// They're too long, so let's try that again
		let attrIndent = `\n${indent}\t`;
		attributes = attrs.join(attrIndent);
		element = `${indent}<${node.tagName}${attrIndent}${attributes}\n${indent}${node.selfClosed ? "/" : ""}>`;
	}

	// If at a newline, add the indent
	// If after an element/brace, add a space
	if (state.output.endsWith("\n")) {
		state.output += indent;
	} else if (
		!state.output.endsWith(">") &&
		!state.output.endsWith("{") &&
		!state.output.endsWith("}")
	) {
		state.output += " ";
	}

	state.output += element.trimStart();

	// If self-closed, we don't need to add anything else
	if (node.selfClosed) {
		return;
	}

	// Add the children
	const oldPreserveWhitespace = state.preserveWhitespace;
	state.preserveWhitespace = node.tagName === "code" || node.tagName === "pre";
	state.indent++;
	for (let c of node.children) {
		formatRenderNode(c, state, options);
	}
	state.indent--;
	state.preserveWhitespace = oldPreserveWhitespace;

	// Add the closing tag
	if (state.output.endsWith("\n")) {
		state.output += indent;
	}
	state.output += `</${node.tagName}>`;
}

function formatTextNode(node: any, state: FormatState, _options: Record<PropertyKey, any>) {
	if (state.preserveWhitespace) {
		state.output += node.content;
		return;
	}

	const indent = "\t".repeat(state.indent);
	let text = node.content.trim();

	// Check if it's just some newlines and, if so, add them
	if (!text) {
		let newLineCount = 0;
		for (let i = 0; i < node.content.length; i++) {
			if (node.content[i] === "\n") newLineCount++;
		}
		if (newLineCount > 0) {
			if (newLineCount > 1 && !state.output.endsWith("{")) {
				state.output += "\n";
			}
			state.output += "\n";
			return;
		}
	}

	// Replace indents + newlines with the correct spacing (e.g. if a block of
	// text has been moved)
	text = text.replaceAll(/\s*\n\s*/g, `\n${indent}`);

	// Add a newline if the text had one at the start
	// Add a space if the text is after a closing tag and had any spaces at the start
	let newLineBefore = /^\s*\n/.test(node.content);
	if (newLineBefore) {
		text = "\n" + indent + text;
	} else if (/(<\/[^<]+>|\/>)$/i.test(state.output) && /^\s+/.test(node.content)) {
		text = " " + text;
	}

	// Add a newline if the text had one at the end
	let newLineAfter = /\n\s*$/.test(node.content);
	if (newLineAfter) {
		text += "\n";
	}

	state.output += text;
}

function formatCommentNode(node: any, state: FormatState, _options: Record<PropertyKey, any>) {
	const indent = "\t".repeat(state.indent);
	switch (node.commentType) {
		case "html":
			state.output += `${indent}<!--${node.content}-->`;
			break;
		case "line":
			state.output += `${indent}@//${node.content}\n`;
			break;
		case "block":
			state.output += `${indent}@/*${node.content}*/`;
			break;
	}
}

function formatStyleChunk(content: string, _options: object) {
	// HACK: should do this when parsing and convert it into a better AST
	const source = `
export default function C() {
${content}
}`;
	const parsed = parseTorp(source);
	if (!parsed.ok || !parsed.template) {
		console.log(`Failed to parse style section: ${parsed.errors.map((e) => e.message).join(", ")}`);
		return content;
	}

	let state: FormatState = {
		// HACK: this should come from the indentation of the @render
		indent: 1,
		output: "",
		preserveWhitespace: false,
	};

	const indent = "\t".repeat(state.indent);
	state.output += `${indent}@style {`;
	state.indent++;
	for (let c of parsed.template.components[0].style!.children) {
		formatStyleNode(c, state);
	}
	state.indent--;
	state.output = state.output.replace(/\n\n$/, "\n");
	state.output += `\n${indent}}`;

	return state.output;
}

// HACK: no types on internal types
function formatStyleNode(node: any, state: FormatState) {
	if (node.gapBefore && !state.output.endsWith("{")) {
		state.output += "\n";
	}
	switch (node.type) {
		case "block": {
			formatStyleBlockNode(node, state);
			break;
		}
		case "attribute": {
			formatStyleAttributeNode(node, state);
			break;
		}
		case "comment": {
			formatStyleCommentNode(node, state);
			break;
		}
		default: {
			console.log("Unknown style node type: " + node.type);
		}
	}
}

function formatStyleBlockNode(node: any, state: FormatState) {
	const indent = "\t".repeat(state.indent);

	state.output += `\n${indent}${node.selector} {`;
	for (let c of node.children) {
		state.indent++;
		formatStyleNode(c, state);
		state.indent--;
	}

	state.output += `\n${indent}}`;
}

function formatStyleAttributeNode(node: any, state: FormatState) {
	const indent = "\t".repeat(state.indent);
	state.output += `\n${indent}${node.name}: ${node.value};`;
}

function formatStyleCommentNode(node: any, state: FormatState) {
	const indent = "\t".repeat(state.indent);
	state.output += `\n${indent}${node.content}`;
}
