import type AttributeNode from "../../types/styles/AttributeNode";
import type BlockNode from "../../types/styles/BlockNode";
import type Style from "../../types/styles/Style";
import type StyleNode from "../../types/styles/StyleNode";
import Builder from "../../utils/Builder";

export default function buildStyles(style: Style, styleHash: string): string {
	const b = new Builder();

	for (let block of style.children) {
		buildStyleNode(block, b, styleHash);
	}

	return b.toString();
}

function buildStyleNode(node: StyleNode, b: Builder, styleHash: string, scoped = true) {
	switch (node.type) {
		case "block": {
			buildBlockNode(node as BlockNode, b, styleHash, scoped);
			break;
		}
		case "attribute": {
			buildAttributeNode(node as AttributeNode, b);
			break;
		}
		case "comment": {
			// Don't include comments
			break;
		}
		default: {
			// eslint-disable-next-line restrict-template-expressions
			throw new Error(`Invalid style node type: ${node.type}`);
		}
	}
}

function buildBlockNode(block: BlockNode, b: Builder, styleHash: string, scoped: boolean) {
	const isKeyframes =
		block.selector.startsWith("@keyframes") || block.selector.startsWith("@-webkit-keyframes");

	if (block.selector.startsWith("@")) {
		// Just output media queries and properties as-is
		b.append(`${block.selector} {`);
	} else {
		block.selector = block.selector.replaceAll(/\s+/g, " ").trim();
		b.append(`${scoped ? scopeSelector(block.selector, styleHash) : block.selector} {`);
	}
	for (let child of block.children) {
		// Keyframe steps (`from`, `to`, `50%`) are not selectors
		buildStyleNode(child, b, styleHash, scoped && !isKeyframes);
	}
	b.append(`}`);
}

/**
 * Appends the component scope class to each compound selector. Both brackets
 * (`[data-x="a b"]`) and parentheses (`:is(.a, .b)`, `:global(...)`) are
 * treated as opaque, so spaces/commas inside them aren't mistaken for
 * combinators. `:global(...)` wrappers are removed without adding the scope.
 */
function scopeSelector(selector: string, styleHash: string): string {
	let result = "";
	let compound = "";
	let bracketDepth = 0;
	let parenDepth = 0;
	let quote: string | null = null;

	const flush = () => {
		if (!compound) return;
		result += scopeCompound(compound, styleHash);
		compound = "";
	};

	for (let i = 0; i < selector.length; i++) {
		const char = selector[i];
		if (quote !== null) {
			compound += char;
			if (char === "\\") {
				compound += selector[++i] ?? "";
			} else if (char === quote) {
				quote = null;
			}
			continue;
		}

		if (char === "\\") {
			compound += char + (selector[++i] ?? "");
		} else if (char === '"' || char === "'") {
			quote = char;
			compound += char;
		} else if (char === "[") {
			bracketDepth += 1;
			compound += char;
		} else if (char === "]") {
			bracketDepth -= 1;
			compound += char;
		} else if (char === "(") {
			parenDepth += 1;
			compound += char;
		} else if (char === ")") {
			parenDepth -= 1;
			compound += char;
		} else if (
			bracketDepth === 0 &&
			parenDepth === 0 &&
			(char === " " || char === "," || char === ">" || char === "+" || char === "~")
		) {
			flush();
			result += char;
		} else {
			compound += char;
		}
	}
	flush();
	return result.trim();
}

function scopeCompound(compound: string, styleHash: string): string {
	if (!compound.includes(":global(")) {
		return addScope(compound, styleHash);
	}
	const { text, onlyGlobal } = stripGlobal(compound);
	return onlyGlobal ? text : addScope(text, styleHash);
}

/** Removes `:global(...)` wrappers, reporting whether anything local remained. */
function stripGlobal(compound: string): { text: string; onlyGlobal: boolean } {
	let text = "";
	let hadLocal = false;
	let i = 0;
	while (i < compound.length) {
		if (compound.startsWith(":global(", i)) {
			const close = findClosingParen(compound, i + ":global".length);
			if (close === -1) {
				text += compound.substring(i);
				break;
			}
			text += compound.substring(i + ":global(".length, close);
			i = close + 1;
			continue;
		}
		const char = compound[i];
		if (char.trim()) hadLocal = true;
		text += char;
		i += 1;
	}
	return { text, onlyGlobal: !hadLocal };
}

function addScope(compound: string, styleHash: string): string {
	const colon = findFirstPseudo(compound);
	const scope = `.torp-${styleHash}`;
	return colon === -1
		? `${compound}${scope}`
		: `${compound.substring(0, colon)}${scope}${compound.substring(colon)}`;
}

/** Finds the first top-level `:` (pseudo-class/element), skipping brackets/strings. */
function findFirstPseudo(compound: string): number {
	let bracketDepth = 0;
	let parenDepth = 0;
	let quote: string | null = null;
	for (let i = 0; i < compound.length; i++) {
		const char = compound[i];
		if (quote !== null) {
			if (char === "\\") {
				i += 1;
			} else if (char === quote) {
				quote = null;
			}
			continue;
		}
		if (char === "\\") {
			i += 1;
		} else if (char === '"' || char === "'") {
			quote = char;
		} else if (char === "[") {
			bracketDepth += 1;
		} else if (char === "]") {
			bracketDepth -= 1;
		} else if (char === "(") {
			parenDepth += 1;
		} else if (char === ")") {
			parenDepth -= 1;
		} else if (bracketDepth === 0 && parenDepth === 0 && char === ":") {
			return i;
		}
	}
	return -1;
}

function findClosingParen(source: string, open: number): number {
	let depth = 0;
	let bracketDepth = 0;
	let quote: string | null = null;
	for (let i = open; i < source.length; i++) {
		const char = source[i];
		if (quote !== null) {
			if (char === "\\") {
				i += 1;
			} else if (char === quote) {
				quote = null;
			}
			continue;
		}
		if (char === "\\") {
			i += 1;
		} else if (char === '"' || char === "'") {
			quote = char;
		} else if (char === "[") {
			bracketDepth += 1;
		} else if (char === "]") {
			bracketDepth -= 1;
		} else if (bracketDepth === 0 && char === "(") {
			depth += 1;
		} else if (bracketDepth === 0 && char === ")") {
			depth -= 1;
			if (depth === 0) return i;
		}
	}
	return -1;
}

function buildAttributeNode(attribute: AttributeNode, b: Builder) {
	b.append(`${attribute.name}: ${attribute.value};`);
}
