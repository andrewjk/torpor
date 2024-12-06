import type { PageEndPoint } from "@tera/build";
import component from "./Editor.tera";

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
