import component from "@/components/settings/Settings.tera";
import type { EndPoint } from "@tera/kit";

export default {
	component,
	head: [{ title: "Settings • Conduit" }],
} satisfies EndPoint;
