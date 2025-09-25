import { $watch } from "@torpor/view";
import type Page from "./Page";

const $page: Page = $watch(
	{
		status: 404,
		url: new URL("http://localhost"),
		form: {},
		error: {
			message: "",
		},
	},
	{
		shallow: true,
	},
);

export default $page;
