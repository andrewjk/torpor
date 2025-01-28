import { type PageEndPoint } from "@torpor/build";
import { $page } from "@torpor/build/state";
import component from "./Error.torp";

export default {
	component,
	head: [{ title: $page.status.toString() }],
} satisfies PageEndPoint;
