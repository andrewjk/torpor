import type { EndPoint } from "@tera/kit";
import { $page } from "@tera/kit/state";
import component from "./Error.tera";

export default {
	component,
	head: [{ title: $page.status.toString() }],
} satisfies EndPoint;
