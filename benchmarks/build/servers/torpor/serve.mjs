import { node } from "@torpor/adapter-node";
import { Server } from "@torpor/build/server";
import { load } from "./dist/server/serverEntry.js";

// Serves the built site the same way `tb --preview` does: every request goes
// through the built serverEntry's `load`. There are no page routes, so no
// template or static assets are needed.
const server = new Server();
server.add("*", (ev) => load(ev));
node.serve(server);
