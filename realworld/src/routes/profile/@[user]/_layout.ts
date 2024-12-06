import type { PageEndPoint } from "@tera/build";
import component from "./Layout.tera";

export default {
	component,
	head: ({ data }) => [{ title: `${data.profile.username} • Conduit` }],
} satisfies PageEndPoint;
