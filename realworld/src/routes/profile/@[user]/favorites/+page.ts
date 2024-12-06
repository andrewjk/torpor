import component from "@/components/account/Profile.tera";
import type { PageEndPoint } from "@tera/build";

export default {
	component,
	head: [{ title: "Favorites • Conduit" }],
} satisfies PageEndPoint;
