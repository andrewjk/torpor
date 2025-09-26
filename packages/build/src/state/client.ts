import type ClientState from "../types/ClientState";
import internal from "./internal";

const client: ClientState = internal().client;

export default client;
