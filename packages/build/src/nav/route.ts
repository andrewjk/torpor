import type { ExactRouteParams, ParseRouteParams } from "../types/ParseRouteParams";

/**
 * Builds a route path in a type-safe manner, filling in dynamic segments, e.g.
 * `route("/posts/[id]", { id: 5 })` returns `/posts/5`. The params object is
 * checked for exact keys: missing or unknown params error at compile time.
 *
 * NOTE: The rest args conditional must stay INLINE — routing it through a type
 * alias defeats `Params` inference, and excess keys stop being checked
 * @param path The route path
 * @param params The route params, required if the path has dynamic segments
 * @returns The path with the params filled in, URI-encoded
 */
export default function route<
	Route extends string,
	Params extends ParseRouteParams<Route> = ParseRouteParams<Route>,
>(
	path: Route,
	...args: string extends Route
		? [params?: Record<string, string>]
		: keyof ParseRouteParams<Route> extends never
			? []
			: [params: Params & ExactRouteParams<Params, ParseRouteParams<Route>>]
): string {
	const params = ((args as unknown[])[0] ?? {}) as Record<string, string>;
	return path.replace(/\[(\.\.\.)?([^\]]+)\]/g, (_, splat: string | undefined, name: string) => {
		const value = params[name];
		if (value === undefined) {
			throw new Error(`Missing param '${name}' for route '${path}'`);
		}
		return splat
			? value
					.split("/")
					.map((segment) => encodeURIComponent(segment))
					.join("/")
			: encodeURIComponent(String(value));
	});
}
