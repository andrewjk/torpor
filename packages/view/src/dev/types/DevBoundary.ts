export default interface DevBoundary {
	type: "component" | "region" | "run" | "watch" | "control" | "branch";
	id: string;
	name: string;
	depth: number;
	//details: string;
	target: any;
}
