import component from "@/components/account/Register.tera";
import type { PageEndPoint } from "@tera/build";

export default {
	component,
	head: [{ title: "Sign up • Conduit" }],
} satisfies PageEndPoint;
