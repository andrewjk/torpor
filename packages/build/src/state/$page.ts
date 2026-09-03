import { $watch } from "@torpor/view";
import type PageState from "../types/PageState";

const PAGE_SYMBOL: unique symbol = Symbol.for("torp.Page");

const $page: PageState =
	// @ts-ignore
	(globalThis[PAGE_SYMBOL] ??=
		// The server request path uses `state/$serverPage`, which stores the
		// same state (same `globalThis` slot) without a reactive proxy
		$watch(
			{
				status: 404,
				url: new URL("http://localhost"),
				form: undefined,
				error: {
					message: "",
				},
			},
			{
				shallow: true,
			},
		));

export default $page;
