import { type PageEndPoint } from "@torpor/build";
import { ok } from "@torpor/build/response";
import component from "./Editor.torp";

export default {
	component,
	load: () =>
		ok({
			article: {
				title: "",
				description: "",
				body: "",
				tagList: [],
			},
		}),
} satisfies PageEndPoint;
