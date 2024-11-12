import component from "@/components/Index.tera";
import type { EndPoint } from "@tera/build";

export default {
	component,
	head: [{ title: "Conduit" }],
} satisfies EndPoint;
