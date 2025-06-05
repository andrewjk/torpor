import { $watch } from "@torpor/view";
import Page from "./Page";

const $page: Page = $watch(
	{
		status: 404,
		url: new URL("http://localhost"),
		error: {
			message: "",
		},
	},
	{ shallow: true },
);

export default $page;
