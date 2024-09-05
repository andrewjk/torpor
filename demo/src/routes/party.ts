import Party from "@/components/Party.tera";
import EndPoint from "../../site/src/types/EndPoint";

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
