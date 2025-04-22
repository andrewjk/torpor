import { $watch } from "@torpor/view";

type Page = {
	status: number;
	url: URL;
};

const $page: Page = $watch(
	{
		status: 404,
		url: new URL("http://localhost"),
	},
	{ shallow: true },
);

export default $page;
