import type { EndPoint } from "@tera/kit";
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
} satisfies EndPoint;
