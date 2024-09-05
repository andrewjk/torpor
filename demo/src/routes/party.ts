import Party from "@/components/Party.tera";
import EndPoint from "../../site/src/types/EndPoint";

export default {
	data: () => {
		console.log("data");
	},
	view: () => {
		return Party;
	},
} satisfies EndPoint;
