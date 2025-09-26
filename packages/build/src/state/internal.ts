import { $watch } from "@torpor/view";
import type ClientState from "../types/ClientState";
import type InternalState from "../types/InternalState";
import type PageState from "../types/PageState";

// Do a weird little dance to ensure that everyone has the same $page and
// client, regardless of if they are entering via serverEntry/clientEntry or the
// built library. There may be an easier way to do this!

const INTERNAL_GLOBAL: unique symbol = Symbol.for("torpor-internal");

export default function internal(): InternalState {
	// @ts-ignore
	if (globalThis[INTERNAL_GLOBAL] === undefined) {
		// TODO: Should use the SSR $watch if entering via serverEntry
		const $page: PageState = $watch(
			{
				status: 404,
				url: new URL("http://localhost"),
				form: {},
				error: {
					message: "",
				},
			},
			{
				shallow: true,
			},
		);
		const client: ClientState = {
			// @ts-ignore This will definitely, 100% get set
			router: null,
			layoutStack: [],
			// TODO: Probably expire after 30 seconds or something?
			prefetchedData: {},
		};

		// @ts-ignore
		globalThis[INTERNAL_GLOBAL] = {
			$page,
			client,
		} satisfies InternalState;
	}
	// @ts-ignore
	return globalThis[INTERNAL_GLOBAL] as InternalState;
}
