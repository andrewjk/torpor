import type Cleanup from "../types/Cleanup";

export default function $serverOnmount(_fn: () => Cleanup | void): void {}
