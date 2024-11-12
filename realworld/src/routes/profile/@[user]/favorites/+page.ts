import component from "@/components/account/Profile.tera";
import type { EndPoint } from "@tera/build";

export default {
	component,
	head: [{ title: "Favorites • Conduit" }],
} satisfies EndPoint;
