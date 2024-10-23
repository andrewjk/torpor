import type Cleanup from "../types/Cleanup";

export default function $serverMount(fn: () => Cleanup | void) {}
