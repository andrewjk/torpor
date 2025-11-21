import type SourceMap from "./SourceMap";

export default function sourceIndexFromCompiledIndex(index: number, map: SourceMap[]): number {
	const mapped = map.find((m: any) => index >= m.compiled.start && index <= m.compiled.end);
	if (!mapped) {
		return -1;
	}
	return mapped.source.start + (index - mapped.compiled.start);
}
