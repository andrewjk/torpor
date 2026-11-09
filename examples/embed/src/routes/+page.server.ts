import { ok } from "@torpor/build/response";
import { type PageServerEndPoint } from "@torpor/build";
import { listApps } from "@/lib/store";

export default {
	load: () => ok({ apps: listApps() }),
} satisfies PageServerEndPoint;
