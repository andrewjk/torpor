import { $watch } from "@torpor/view";
import type PageState from "../types/PageState";

const PAGE_SYMBOL: unique symbol = Symbol.for("torp.Page");

/**
 * The client's page state, which client navigation keeps up to date and
 * passes to the page's components as `$context.$page`. (On the server, each
 * request has its own page state; see `site/requestPage.ts`.)
 */
const $page: PageState =
	// @ts-ignore
	(globalThis[PAGE_SYMBOL] ??= $watch(
		{
			status: 404,
			url: new URL("http://localhost"),
			form: undefined,
			flash: undefined,
			error: {
				message: "",
			},
		},
		{
			shallow: true,
		},
	));

export default $page;
