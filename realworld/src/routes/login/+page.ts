import component from "@/components/account/Login.tera";
import type { PageEndPoint } from "@tera/build";

export default {
	component,
	head: [{ title: "Sign in • Conduit" }],
} satisfies PageEndPoint;
