import type PageState from "../types/PageState";
import { createScopedPage } from "./scopedPage";

const PAGE_SYMBOL: unique symbol = Symbol.for("torp.Page");

// The server's `$page` is scoped to the request being handled (see
// `createScopedPage` and `site/pageScope.ts`), and has no reactive
// subscribers, so it isn't a `$watch` proxy. It shares the same `globalThis`
// slot as the client `$page`, which creates the same scoped proxy when it
// is evaluated on the server first, so both variants always see the same
// state whichever loads first.
const $page: PageState =
	// @ts-ignore
	(globalThis[PAGE_SYMBOL] ??= createScopedPage());

export default $page;
