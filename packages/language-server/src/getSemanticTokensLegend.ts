import {
	SemanticTokenModifiers,
	SemanticTokenTypes,
	SemanticTokensLegend,
} from "vscode-languageserver";

// Stole this from the Svelte extension

/**
 * extended from https://github.com/microsoft/TypeScript/blob/35c8df04ad959224fad9037e340c1e50f0540a49/src/services/classifier2020.ts#L9
 * so that we don't have to map it into our own legend
 */
export const TokenType = {
	class: 0,
	enum: 1,
	interface: 2,
	namespace: 3,
	typeParameter: 4,
	type: 5,
	parameter: 6,
	variable: 7,
	enumMember: 8,
	property: 9,
	function: 10,
	member: 11,
} as const;

export type TokenType = (typeof TokenType)[keyof typeof TokenType];

/**
 * adopted from https://github.com/microsoft/TypeScript/blob/35c8df04ad959224fad9037e340c1e50f0540a49/src/services/classifier2020.ts#L13
 * so that we don't have to map it into our own legend
 */
export const TokenModifier = {
	declaration: 0,
	static: 1,
	async: 2,
	readonly: 3,
	defaultLibrary: 4,
	local: 5,
} as const;

export type TokenModifier = (typeof TokenModifier)[keyof typeof TokenModifier];

export function getSemanticTokensLegend(): SemanticTokensLegend {
	const tokenModifiers: string[] = [];
	(
		[
			[TokenModifier.declaration, SemanticTokenModifiers.declaration],
			[TokenModifier.static, SemanticTokenModifiers.static],
			[TokenModifier.async, SemanticTokenModifiers.async],
			[TokenModifier.readonly, SemanticTokenModifiers.readonly],
			[TokenModifier.defaultLibrary, SemanticTokenModifiers.defaultLibrary],
			[TokenModifier.local, "local"],
		] as const
	).forEach(([tsModifier, legend]) => (tokenModifiers[tsModifier] = legend));

	const tokenTypes: string[] = [];
	(
		[
			[TokenType.class, SemanticTokenTypes.class],
			[TokenType.enum, SemanticTokenTypes.enum],
			[TokenType.interface, SemanticTokenTypes.interface],
			[TokenType.namespace, SemanticTokenTypes.namespace],
			[TokenType.typeParameter, SemanticTokenTypes.typeParameter],
			[TokenType.type, SemanticTokenTypes.type],
			[TokenType.parameter, SemanticTokenTypes.parameter],
			[TokenType.variable, SemanticTokenTypes.variable],
			[TokenType.enumMember, SemanticTokenTypes.enumMember],
			[TokenType.property, SemanticTokenTypes.property],
			[TokenType.function, SemanticTokenTypes.function],
			// member is renamed to method in vscode codebase to match LSP default
			[TokenType.member, SemanticTokenTypes.method],
		] as const
	).forEach(([tokenType, legend]) => (tokenTypes[tokenType] = legend));

	return {
		tokenModifiers,
		tokenTypes,
	};
}
