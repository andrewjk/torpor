import { $watch } from "@torpor/view";
import type PageState from "../types/PageState";

const PAGE_SYMBOL: unique symbol = Symbol.for("t_page");

const $page: PageState =
	// @ts-ignore
	(globalThis[PAGE_SYMBOL] ??=
		// TODO: Should use the SSR $watch if entering via serverEntry
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
