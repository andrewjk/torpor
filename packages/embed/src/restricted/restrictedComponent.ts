import type { ServerComponent } from "@torpor/view/ssr";
import type EmbedArtifact from "../types/EmbedArtifact";
import type { RestrictedSlotRender, RenderRestrictedOptions } from "./types";
import renderRestricted from "./renderRestricted";

/**
 * The per-render options a restricted artifact used as a component may
 * need. Props and slots come from the component call; everything else is
 * fixed at wrapper-creation time.
 */
export type RestrictedComponentOptions = Omit<
	RenderRestrictedOptions,
	"props" | "slots" | "bridge"
>;

/**
 * Wraps a restricted artifact as a **server component**, so another
 * restricted artifact can render it: `<TicketList>…</TicketList>` in the
 * outer template calls this component, the interpreter renders the inner
 * artifact recursively, and its HTML is inlined.
 *
 * ```ts
 * const { body } = await renderRestricted(outerArtifact, {
 * 	props,
 * 	components: {
 * 		TicketList: restrictedComponent(innerArtifact, {
 * 			sources,        // the inner artifact's own data layer
 * 			formatters,
 * 			deriveLimits,
 * 		}),
 * 	},
 * });
 * ```
 *
 * The outer template's fill children become the inner artifact's incoming
 * slots: the inner `<slot item={row}>` evaluates its slot props in its own
 * scope and calls the fill's render, falling back to its fallback children
 * when the outer passes no fill for that slot name.
 *
 * On the **client**, pass the inner artifact's client build via the outer's
 * `scope` (the client build handles slots natively). An inner artifact with
 * data requirements needs its `$data` bag through props at hydration —
 * the host adapts:
 *
 * ```ts
 * import { loadComponent } from "@torpor/embed";
 * const inner = loadComponent(innerArtifact, scope);
 * hydrateEmbed(target, outerArtifact, props, {
 * 	scope: {
 * 		ui: {
 * 			TicketList: ($p, $a, usageProps, $c, slots) =>
 * 				inner($p, $a, { ...usageProps, $data }, $c, slots),
 * 		},
 * 	},
 * });
 * ```
 *
 * Note the wrapper boundary: cycles (`A` renders `B` renders `A`) recurse
 * until the stack overflows — construct component maps acyclically.
 */
export default function restrictedComponent(
	artifact: EmbedArtifact,
	options?: RestrictedComponentOptions,
): ServerComponent {
	if (artifact.server?.template === undefined) {
		throw new Error(
			`Embed "${artifact.id}" is missing its restricted server template -- recompile it from its source.`,
		);
	}
	return async (props, _context, slots) => {
		const result = await renderRestricted(artifact, {
			...options,
			props: (props ?? undefined) as Record<string, any> | undefined,
			slots: slots as Record<string, RestrictedSlotRender> | undefined,
		});
		// Inline the artifact's styles into head, matching the JS server
		// build's component emission (`t_head += "<style id='…'>…</style>"`,
		// with the same whitespace collapsing) — otherwise a scoped-styled
		// inner artifact renders unstyled through the boundary. Children'
		// heads come first, then the artifact's own styles, like the JS build.
		const styleTags = (artifact.styles ?? [])
			.map((style) => `<style id='${style.hash}'>${style.style.replaceAll(/\s+/g, " ")}</style>`)
			.join("");
		return { body: result.body, head: result.head + styleTags };
	};
}
