import type Cleanup from "../types/Cleanup";

export default function $serverMount(_fn: () => Cleanup | void): void {}
