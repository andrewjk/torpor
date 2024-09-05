import Index from "@/components/Index.tera";
import EndPoint from "../../site/src/types/EndPoint";

export default {
	data: () => {
		console.log("data");
	},
	view: () => {
		return Index;
	},
} satisfies EndPoint;
