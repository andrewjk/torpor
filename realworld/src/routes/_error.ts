import type { PageEndPoint } from "@tera/build";
import { $page } from "@tera/build/state";
import component from "./Error.tera";

export default {
	component,
	head: [{ title: $page.status.toString() }],
} satisfies PageEndPoint;
