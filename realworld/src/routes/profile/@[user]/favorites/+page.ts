import component from "@/components/account/Profile.tera";
import type { EndPoint } from "@tera/kit";

export default {
	component,
	head: [{ title: "Favorites • Conduit" }],
} satisfies EndPoint;
