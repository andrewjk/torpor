import { ok } from "@torpor/build/response";
import { type PageServerEndPoint } from "@torpor/build";
import { listSubmissions } from "@/lib/submissions";

export default {
	load: () => ok({ submissions: listSubmissions() }),
} satisfies PageServerEndPoint;
