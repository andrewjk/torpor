import { type Duplex } from "node:stream";

export const INTERNAL_BODY: unique symbol = Symbol("internal_body");

export const INTERNAL_UPGRADE: unique symbol = Symbol("internal_upgrade");

/**
 * The raw Node socket and the bytes already read past the request headers for
 * an HTTP upgrade (see `upgradePair`).
 */
export type UpgradePair = {
	socket: Duplex;
	head: Buffer;
};
