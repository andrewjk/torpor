import { $watch } from "@torpor/view";
import type PageState from "../types/PageState";
import { createScopedPage } from "./scopedPage";

const PAGE_SYMBOL: unique symbol = Symbol.for("torp.Page");

const $page: PageState =
	// @ts-ignore
	(globalThis[PAGE_SYMBOL] ??=
		typeof document === "undefined"
			? // On the server (e.g. a component that imports `$page` being
				// loaded before the request handler), use the same request-scoped
				// state as `state/$serverPage`, so concurrent requests can't see
				// each other's page state
				createScopedPage()
			: $watch(
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
