import { Article, Tag, User } from "@prisma/client";
import profileView from "./profileView";

type FullArticle = Article & {
	tagList: Tag[];
	author: User & { followedBy: User[] };
	_count: { favoritedBy: number };
};

export default function articleView(
	article: FullArticle,
	currentUser?: User & { favorites: Article[] },
) {
	const favorited = currentUser
		? currentUser.favorites.some((value) => value.slug === article.slug)
		: false;

	const tagListView = article.tagList.map((tag) => tag.tagName).sort();

	const authorView = profileView(article.author, currentUser);

	const articleView = {
		slug: article.slug,
		title: article.title,
		description: article.description,
		body: article.body,
		tagList: tagListView,
		createdAt: article.createdAt,
		updatedAt: article.updatedAt,
		favorited: favorited,
		favoritesCount: article._count.favoritedBy,
		author: authorView,
	};
	return articleView;
}
