import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable("users")
		.addColumn("email", "text", (col) => col.unique())
		.addColumn("username", "text", (col) => col.primaryKey())
		.addColumn("password", "text", (col) => col.notNull())
		.addColumn("bio", "text")
		.addColumn("image", "text")
		.execute();

	await db.schema
		.createTable("user_follows")
		.addColumn("user_id", "text", (col) => col.notNull())
		.addColumn("follow_id", "text", (col) => col.notNull())
		.execute();

	await db.schema
		.createTable("user_favorites")
		.addColumn("user_id", "text", (col) => col.notNull())
		.addColumn("article_id", "text", (col) => col.notNull())
		.execute();

	await db.schema
		.createTable("articles")
		.addColumn("title", "text", (col) => col.unique())
		.addColumn("slug", "text", (col) => col.primaryKey())
		.addColumn("description", "text", (col) => col.notNull())
		.addColumn("body", "text", (col) => col.notNull())
		.addColumn("author_id", "text", (col) => col.notNull())
		.addColumn("created_at", "text", (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
		.addColumn("updated_at", "text", (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
		.execute();

	await db.schema
		.createTable("comments")
		.addColumn("id", "integer", (col) => col.primaryKey())
		.addColumn("body", "text", (col) => col.notNull())
		.addColumn("author_id", "text", (col) => col.notNull())
		.addColumn("article_id", "text", (col) => col.notNull())
		.addColumn("created_at", "text", (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
		.addColumn("updated_at", "text", (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
		.execute();

	await db.schema
		.createTable("tags")
		.addColumn("tagname", "text", (col) => col.primaryKey())
		.execute();

	await db.schema
		.createTable("article_tags")
		.addColumn("article_id", "text", (col) => col.notNull())
		.addColumn("tag_id", "text", (col) => col.notNull())
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable("user").execute();
	await db.schema.dropTable("user_follows").execute();
	await db.schema.dropTable("user_favorites").execute();
	await db.schema.dropTable("articles").execute();
	await db.schema.dropTable("comments").execute();
	await db.schema.dropTable("tags").execute();
}
