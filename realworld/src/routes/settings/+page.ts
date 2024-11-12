import component from "@/components/settings/Settings.tera";
import type { EndPoint } from "@tera/build";

export default {
	component,
	head: [{ title: "Settings • Conduit" }],
} satisfies EndPoint;
