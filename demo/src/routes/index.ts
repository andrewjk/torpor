import Index from "@/components/Index.tera";
import type EndPoint from "../../site/src/types/EndPoint";

export default {
	data: () => {
		console.log("data");
	},
	view: () => {
		return {
			component: Index,
		};
	},
} satisfies EndPoint;
