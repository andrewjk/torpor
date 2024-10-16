import { $watch } from "@tera/view";

const $page = $watch(
	{
		status: 404,
		url: new URL("http://localhost"),
	},
	{ shallow: true },
);

export default $page;
