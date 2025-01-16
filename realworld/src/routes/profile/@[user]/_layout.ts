import type { PageEndPoint } from "@torpor/build";
import component from "./Layout.torp";

export default {
	component,
	head: ({ data }) => [{ title: `${data.profile.username} • Conduit` }],
} satisfies PageEndPoint;
