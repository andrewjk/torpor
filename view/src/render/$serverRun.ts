import type Cleanup from "../types/Cleanup";

export default function $serverRun(fn: () => Cleanup | void) {}
