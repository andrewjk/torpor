import { Tag } from "@prisma/client";

export default function tagView(tag: Tag) {
	const tagView = tag.tagName;
	return tagView;
}
