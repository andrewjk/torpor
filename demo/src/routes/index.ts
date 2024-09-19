import Index from "@/components/Index.tera";
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
