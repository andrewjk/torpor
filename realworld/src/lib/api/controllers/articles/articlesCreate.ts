import { Tag } from "@prisma/client";
import { created, serverError, unauthorized } from "@tera/build/response";
import articleCreatePrisma from "../../db/article/articleCreatePrisma";
import tagsCreatePrisma from "../../db/tag/tagsCreatePrisma";
import userGetPrisma from "../../db/user/userGetPrisma";
import getErrorMessage from "../../utils/getErrorMessage";
import articleView from "../../views/articleView";

interface Article {
	title: string;
	description: string;
	body: string;
	tagList?: Array<string>;
}

/**
 * Article controller that must receive a request with an authenticated user.
 * The body of the request must have the article object that is an @interface Article.
 * @param req Request with a jwt token verified
 * @param res Response
 * @param next NextFunction
 * @returns void
 */
export default async function articlesCreate(appData: Record<string, any>, request: Request) {
	const { title, description, body, tagList }: Article = (await request.json()).article;
	const userName = appData.user?.username;

	try {
		// Get current user
		const currentUser = await userGetPrisma(userName);
		if (!currentUser) return unauthorized();

		// Create list of tags
		let tags: Tag[] = [];
		if (tagList && tagList.length > 0) {
			tags = await tagsCreatePrisma(tagList);
		}

		// Create the article
		const article = await articleCreatePrisma(
			{ title, description, body },
			tags,
			currentUser.username,
		);

		// Create article view
		const view = articleView(article, currentUser);
		return created({ article: view });
	} catch (error) {
		const message = getErrorMessage(error).message;
		return serverError(message);
	}
}
