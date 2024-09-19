import Index from "@/components/Motion.tera";
import { type EndPoint } from "@tera/kit";

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
