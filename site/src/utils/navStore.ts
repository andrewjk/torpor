import { $watch } from "@torpor/view";

/**
 * Shared state for the navigation drawer in the site header. Only used
 * client-side: the drawer starts closed, so it is never rendered server-side.
 */
export const navStore = $watch({
	visible: false,
});
