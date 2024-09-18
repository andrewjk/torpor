import Party from "@/components/Party.tera";
import type EndPoint from "../../site/src/types/EndPoint";

export default {
	data: () => {
		console.log("data");
	},
	view: () => {
		return {
			component: Party,
		};
	},
} satisfies EndPoint;
