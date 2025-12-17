import type Boundary from "./Boundary";

export default interface State {
	warning: string;
	error: string;
	boundaries: Boundary[];
	events: string[];

	reload: () => void;
}
