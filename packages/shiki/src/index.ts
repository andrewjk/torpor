import {
	BundledHighlighterOptions,
	CodeToHastOptions,
	CodeToTokensBaseOptions,
	CodeToTokensOptions,
	CodeToTokensWithThemesOptions,
	CreateHighlighterFactory,
	HighlighterGeneric,
	RequireKeys,
	ShorthandsBundle,
	ThemedToken,
	ThemedTokenWithVariants,
	TokensResult,
	createBundledHighlighter,
	createSingletonShorthands,
} from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const bundledLanguages = {
	torpor: () => import("@torpor/textmate"),
};

const bundledThemes = {
	"light-plus": () => import("@shikijs/themes/light-plus"),
	"dark-plus": () => import("@shikijs/themes/dark-plus"),
};

// This creates your custom 'createHighlighter' function with fine-grained bundles
export const createHighlighter: CreateHighlighterFactory<"torpor", "light-plus" | "dark-plus"> =
	/* @__PURE__ */ createBundledHighlighter({
		langs: bundledLanguages,
		themes: bundledThemes,
		engine: () => createJavaScriptRegexEngine(),
	});

// This creates the shorthands for you
const dest: ShorthandsBundle<"torpor", "light-plus" | "dark-plus"> =
	/* @__PURE__ */ createSingletonShorthands(createHighlighter);

const codeToHtml: (
	code: string,
	options: CodeToHastOptions<"torpor", "light-plus" | "dark-plus">,
) => Promise<string> = dest.codeToHtml;
const codeToHast: typeof dest.codeToHast = dest.codeToHast;
const codeToTokensBase: (
	code: string,
	options: RequireKeys<
		CodeToTokensBaseOptions<"torpor", "light-plus" | "dark-plus">,
		"theme" | "lang"
	>,
) => Promise<ThemedToken[][]> = dest.codeToTokensBase;
const codeToTokens: (
	code: string,
	options: CodeToTokensOptions<"torpor", "light-plus" | "dark-plus">,
) => Promise<TokensResult> = dest.codeToTokens;
const codeToTokensWithThemes: (
	code: string,
	options: RequireKeys<
		CodeToTokensWithThemesOptions<"torpor", "light-plus" | "dark-plus">,
		"lang" | "themes"
	>,
) => Promise<ThemedTokenWithVariants[][]> = dest.codeToTokensWithThemes;
const getSingletonHighlighter: (
	options?: Partial<BundledHighlighterOptions<"torpor", "light-plus" | "dark-plus">> | undefined,
) => Promise<HighlighterGeneric<"torpor", "light-plus" | "dark-plus">> =
	dest.getSingletonHighlighter;
const getLastGrammarState: typeof dest.getLastGrammarState = dest.getLastGrammarState;

export {
	codeToHtml,
	codeToHast,
	codeToTokensBase,
	codeToTokens,
	codeToTokensWithThemes,
	getSingletonHighlighter,
	getLastGrammarState,
};

/*
type X = {
	codeToHtml: (
		code: string,
		options: CodeToHastOptions<"torpor", "light-plus" | "dark-plus">,
	) => Promise<string>;
	codeToHast: typeof dest.codeToHast;
	codeToTokensBase: (
		code: string,
		options: RequireKeys<
			CodeToTokensBaseOptions<"torpor", "light-plus" | "dark-plus">,
			"theme" | "lang"
		>,
	) => Promise<ThemedToken[][]>;
	codeToTokens: (
		code: string,
		options: CodeToTokensOptions<
			"torpor",
			"light-plus" | "dark-plus"
		>,
	) => Promise<TokensResult>;
	codeToTokensWithThemes: (
		code: string,
		options: RequireKeys<
			CodeToTokensWithThemesOptions<
				"torpor",
				"light-plus" | "dark-plus"
			>,
			"lang" | "themes"
		>,
	) => Promise<ThemedTokenWithVariants[][]>;
	getSingletonHighlighter: (
		options?:
			| Partial<
					BundledHighlighterOptions<
						"torpor",
						"light-plus" | "dark-plus"
					>
			  >
			| undefined,
	) => Promise<
		HighlighterGeneric<"torpor", "light-plus" | "dark-plus">
	>;
	getLastGrammarState: typeof dest.getLastGrammarState;
};
*/
