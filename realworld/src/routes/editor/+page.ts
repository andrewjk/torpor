import type { PageEndPoint } from "@torpor/build";
import component from "./Editor.torp";

export default {
	component,
	load: () => ({
		article: {
			title: "",
			description: "",
			body: "",
			tagList: [],
		},
	}),
} satisfies PageEndPoint;
