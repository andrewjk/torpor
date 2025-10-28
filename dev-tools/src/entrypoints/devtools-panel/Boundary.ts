export interface Boundary {
	type: string;
	id: string;
	name: string;
	depth: number;
	expanded: boolean;
	details: string;
	onexpand: (id: string) => void;
}

export interface State {
	warning: string;
	error: string;
	data: {
		boundaries: Boundary[];
	};
}
