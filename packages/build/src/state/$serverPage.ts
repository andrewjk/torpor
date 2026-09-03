import { $watch } from "@torpor/view/ssr";
import type PageState from "../types/PageState";

const PAGE_SYMBOL: unique symbol = Symbol.for("torp.Page");

// The server request path has no reactive subscribers, so the state is
// stored plainly ($watch from `@torpor/view/ssr` is a no-op that returns
// the object itself) instead of through a reactive proxy. Shares the same
// `globalThis` slot as the client `$page`, so both variants always see the
// same state object whichever loads first.
const $page: PageState =
	// @ts-ignore
	(globalThis[PAGE_SYMBOL] ??= $watch({
		status: 404,
		url: new URL("http://localhost"),
		form: undefined,
		error: {
			message: "",
		},
	}));

export default $page;
