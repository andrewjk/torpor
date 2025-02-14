import { ok } from "@torpor/build/response";
import prisma from "../../db/prisma";
import tagView from "../../views/tagView";

/**
 * Tags controller that responds with a list of all the tags on the system.
 * @param _req
 * @param res
 * @returns
 */
export default async function tagsGet() {
	// Get all the tags
	const tags = await prisma.tag.findMany();

	// Create the tags view
	const tagsView = tags.map((tag) => tagView(tag));

	return ok({ tags: tagsView });
}
