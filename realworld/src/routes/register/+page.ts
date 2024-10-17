import component from "@/components/account/Register.tera";
import type { EndPoint } from "@tera/kit";

export default {
	component,
	head: [{ title: "Sign up • Conduit" }],
} satisfies EndPoint;
