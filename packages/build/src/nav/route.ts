import type { RouteArgs } from "../types/ParseRouteParams";

/**
 * Builds a route path in a type-safe manner, filling in dynamic segments, e.g.
 * `route("/posts/[id]", { id: 5 })` returns `/posts/5`.
 * @param path The route path
 * @param params The route params, required if the path has dynamic segments
 * @returns The path with the params filled in, URI-encoded
 */
export default function route<Route extends string>(
	path: Route,
	...args: RouteArgs<Route>
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
