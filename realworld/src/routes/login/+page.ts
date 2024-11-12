import component from "@/components/account/Login.tera";
import type { EndPoint } from "@tera/build";

export default {
	component,
	head: [{ title: "Sign in • Conduit" }],
} satisfies EndPoint;
