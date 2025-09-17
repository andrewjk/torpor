import context from "../render/context";

export default function batchStart(): void {
	context.batch++;
}
