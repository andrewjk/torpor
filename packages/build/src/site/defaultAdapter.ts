import type Adapter from "../types/Adapter";

// TODO: This should be an adapter-auto package that conditionally loads other packages...

const defaultAdapter: Adapter = {
	serve: () => {
		console.log("An adapter needs to be set in site.config");
	},
};

export default defaultAdapter;
