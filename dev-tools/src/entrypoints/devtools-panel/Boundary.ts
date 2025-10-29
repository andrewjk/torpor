export interface Boundary {
	type: string;
	id: string;
	name: string;
	depth: number;
	recent: boolean;
	expanded: boolean;
	details: string;
	onexpand: (id: string) => void;
	onmark: (id: string) => void;
	onunmark: () => void;
}

export interface State {
	warning: string;
	error: string;
	data: {
		boundaries: Boundary[];
	};
}
