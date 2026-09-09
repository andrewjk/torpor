/**
 * A simple trie router for path patterns.
 *
 * Pattern segments:
 * - `posts` — static segment
 * - `[id]` — matches one non-empty path segment, captured as `params.id`
 * - `[...path]` — matches the rest of the path (at least one segment),
 *   captured as `params.path`
 * - `*` — matches the rest of the path (possibly nothing), not captured
 * - `*.css` — a segment with an embedded `*` matches one path segment
 *
 * `*` and `[...]` must be the last segment of a pattern. Matching priority at
 * each level is static, then param, then glob, then rest. Trailing slashes are
 * ignored, so `/posts` and `/posts/` match the same route.
 */
export default class PathTrie<T> {
	#root = new TrieNode<T>();

	/**
	 * Registers a value at a path pattern. The first registration of an exact
	 * pattern wins, matching the previous regex-scanning router.
	 */
	insert(pattern: string, value: T): void {
		let node = this.#root;
		const segments = splitPath(pattern);
		for (let i = 0; i < segments.length; i++) {
			const segment = segments[i];
			if (segment === "*") {
				if (i !== segments.length - 1) {
					throw new Error(`The '*' wildcard must be the last segment of a path: ${pattern}`);
				}
				node.rest ??= { name: undefined, allowEmpty: true, child: new TrieNode() };
				node = node.rest.child;
			} else if (segment.startsWith("[...") && segment.endsWith("]")) {
				if (i !== segments.length - 1) {
					throw new Error(`The '[...x]' splat must be the last segment of a path: ${pattern}`);
				}
				node.rest ??= {
					name: segment.slice(4, -1),
					allowEmpty: false,
					child: new TrieNode(),
				};
				node = node.rest.child;
			} else if (segment.startsWith("[") && segment.endsWith("]")) {
				node.param ??= { name: segment.slice(1, -1), child: new TrieNode() };
				node = node.param.child;
			} else if (segment.includes("*")) {
				node.glob ??= { regex: globToRegex(segment), child: new TrieNode() };
				node = node.glob.child;
			} else {
				node.static ??= new Map();
				let child = node.static.get(segment);
				if (!child) {
					child = new TrieNode();
					node.static.set(segment, child);
				}
				node = child;
			}
		}
		node.value ??= value;
	}

	/**
	 * Matches a request path against the trie. Returns the registered value
	 * and any captured params, or undefined when nothing matches.
	 */
	match(path: string): PathMatch<T> | undefined {
		// Trailing slashes are optional: `/posts/` matches `/posts`. Whether
		// there WAS a trailing separator still matters for a trailing bare
		// `*`, which requires one (e.g. `/assets/*` matches `/assets/` but
		// not `/assets`)
		let trailingSlash = path === "/";
		while (path.length > 1 && path.endsWith("/")) {
			path = path.slice(0, -1);
			trailingSlash = true;
		}
		const segments = path === "/" ? [] : splitPath(path);
		return this.#matchNode(this.#root, segments, 0, {}, trailingSlash);
	}

	#matchNode(
		node: TrieNode<T>,
		segments: string[],
		i: number,
		params: Record<string, string>,
		trailingSlash: boolean,
	): PathMatch<T> | undefined {
		if (i === segments.length) {
			if (node.value !== undefined) {
				return { value: node.value, params: orUndefined(params) };
			}
			// A trailing bare `*` also matches nothing, when the path ended
			// with its separator (e.g. `/assets/*` matches `/assets/`)
			const rest = node.rest;
			if (rest?.allowEmpty && trailingSlash && rest.child.value !== undefined) {
				return { value: rest.child.value, params: orUndefined(params) };
			}
			return undefined;
		}

		const segment = segments[i];

		// Static segments win over params
		const stat = node.static?.get(segment);
		if (stat) {
			const match = this.#matchNode(stat, segments, i + 1, params, trailingSlash);
			if (match) return match;
		}

		if (node.param && segment !== "") {
			const match = this.#matchNode(
				node.param.child,
				segments,
				i + 1,
				{
					...params,
					[node.param.name]: segment,
				},
				trailingSlash,
			);
			if (match) return match;
		}

		if (node.glob?.regex.test(segment)) {
			const glob = node.glob;
			const match = this.#matchNode(glob.child, segments, i + 1, params, trailingSlash);
			if (match) return match;
		}

		// The rest matcher consumes all remaining segments
		const rest = node.rest;
		if (rest?.child.value !== undefined) {
			// Only build the captured value (and a new params object) when the
			// pattern actually names it — a bare `*` catch-all shouldn't pay
			// for a slice+join on every request
			if (rest.name !== undefined) {
				return {
					value: rest.child.value,
					params: orUndefined({ ...params, [rest.name]: segments.slice(i).join("/") }),
				};
			}
			return { value: rest.child.value, params: orUndefined(params) };
		}

		return undefined;
	}
}

export interface PathMatch<T> {
	value: T;
	params: Record<string, string> | undefined;
}

class TrieNode<T> {
	value: T | undefined = undefined;
	static: Map<string, TrieNode<T>> | undefined;
	param: { name: string; child: TrieNode<T> } | undefined;
	glob: { regex: RegExp; child: TrieNode<T> } | undefined;
	rest: { name: string | undefined; allowEmpty: boolean; child: TrieNode<T> } | undefined;
}

/**
 * Splits a path or pattern into segments, dropping the leading empty segment
 * and any trailing empty (from a trailing slash). `/posts/5` becomes
 * `["posts", "5"]` and `/` becomes `[]`.
 */
function splitPath(path: string): string[] {
	const segments = path.split("/");
	if (segments[0] === "") segments.shift();
	if (segments.length && segments[segments.length - 1] === "") segments.pop();
	return segments;
}

/**
 * Compiles a pattern segment with an embedded `*` (e.g. `*.css`) into a
 * regex that matches a single path segment.
 */
function globToRegex(segment: string): RegExp {
	const source = segment
		.split("*")
		.map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
		.join(".*");
	return new RegExp(`^${source}$`);
}

function orUndefined(params: Record<string, string>): Record<string, string> | undefined {
	return Object.keys(params).length ? params : undefined;
}
