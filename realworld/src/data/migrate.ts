import { LibsqlDialect } from "@libsql/kysely-libsql";
import { promises as fs } from "fs";
import { FileMigrationProvider, Kysely, Migrator } from "kysely";
import * as path from "path";
import { Database } from "./types";

async function migrateToLatest() {
	console.log("\nApplying migrations...");

	const db = new Kysely<Database>({
		dialect: new LibsqlDialect({
			url: "file:src/data/dev.db",
		}),
	});

	const migrator = new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.resolve("src/data/migrations"),
		}),
	});

	const { error, results } = await migrator.migrateToLatest();

	results?.forEach((it) => {
		if (it.status === "Success") {
			console.log(`Migration "${it.migrationName}" was executed successfully`);
		} else if (it.status === "Error") {
			console.error(`Failed to execute migration "${it.migrationName}"`);
		}
	});

	if (error) {
		console.error("Failed to migrate");
		console.error(error);
		process.exit(1);
	}

	await db.destroy();
}

migrateToLatest();
