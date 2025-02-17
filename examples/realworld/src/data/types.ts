import { Generated } from "kysely";

export interface Database {
	Users: UsersTable;
	UserFollows: UserFollowsTable;
	UserFavorites: Favorites;

	Articles: ArticlesTable;

	Comments: Comment;
	Tag: Tag;
}

export interface UsersTable {
	email: string;
	username: string;
	password: string;
	bio: string | null;
	image: string | null;
}

export interface UserFollowsTable {
	user_id: string;
	follow_id: string;
}

export type ArticlesTable = {
	title: string;
	slug: string;
	description: string;
	body: string;
	author_id: string;
	created_at: Generated<string>;
	updated_at: Generated<string>;
};

export type ArticleToTag = {
	A: string;
	B: string;
};
export type Comment = {
	id: Generated<number>;
	createdAt: Generated<string>;
	updatedAt: Generated<string>;
	/**
	 * The main content of the comment.
	 */
	body: string;
	/**
	 * Username of the author of this comment.
	 */
	authorUsername: string;
	/**
	 * Article slug that this comment belongs to.
	 */
	articleSlug: string;
};
export type Favorites = {
	A: string;
	B: string;
};
export type Tag = {
	tagName: string;
};
