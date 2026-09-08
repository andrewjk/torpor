import component from "@/views/blog/PostPage.torp";
import { type PageEndPoint } from "@torpor/build";

export default {
	component,
} satisfies PageEndPoint<"/blog/[slug]">;
