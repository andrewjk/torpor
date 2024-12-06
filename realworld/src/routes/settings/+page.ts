import component from "@/components/settings/Settings.tera";
import type { PageEndPoint } from "@tera/build";

export default {
	component,
	head: [{ title: "Settings • Conduit" }],
} satisfies PageEndPoint;
