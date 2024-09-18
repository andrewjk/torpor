import component from "@/components/Components/Home/AccordionTest.tera";
import type EndPoint from "../../site/src/types/EndPoint";

export default {
	data: () => {
		console.log("data");
	},
	view: () => {
		return {
			component,
		};
	},
} satisfies EndPoint;
