import type Cleanup from "../types/Cleanup";

export default function $serverRun(_fn: () => Cleanup | void): void {}
