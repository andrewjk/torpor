import component from "@/components/account/Profile.torp";
import { type PageEndPoint } from "@torpor/build";

export default {
	component,
	head: [{ title: "Favorites • Conduit" }],
} satisfies PageEndPoint;
