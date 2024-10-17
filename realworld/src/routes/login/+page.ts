import component from "@/components/account/Login.tera";
import type { EndPoint } from "@tera/kit";

export default {
	component,
	head: [{ title: "Sign in • Conduit" }],
} satisfies EndPoint;
