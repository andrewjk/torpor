import Party from "@/components/Party.tera";
import { type EndPoint } from "@tera/kit";

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
