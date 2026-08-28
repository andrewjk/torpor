import { build } from "@torpor/view/compile";

type SourceMap = ReturnType<typeof build>["map"][number];

export type { SourceMap as default };
