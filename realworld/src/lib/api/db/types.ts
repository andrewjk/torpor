import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Article = {
    title: string;
    /**
     * Slug is an uri safe string derived from the title.
     */
    slug: string;
    /**
     * Description for SEO of this article.
     */
    description: string;
    /**
     * The main content of the article.
     */
    body: string;
    /**
     * Username of the author of this article.
     */
    authorUsername: string;
    createdAt: Generated<string>;
    updatedAt: Generated<string>;
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
export type User = {
    /**
     * User email for registering and login use.
     */
    email: string;
    /**
     * User internal id.
     */
    username: string;
    /**
     * User password stored in the database.
     */
    password: string;
    /**
     * User biographical information.
     */
    bio: string | null;
    /**
     * Link to the user avatar.
     */
    image: string | null;
};
export type UserFollows = {
    A: string;
    B: string;
};
export type DB = {
    _ArticleToTag: ArticleToTag;
    _Favorites: Favorites;
    _UserFollows: UserFollows;
    Article: Article;
    Comment: Comment;
    Tag: Tag;
    User: User;
};
