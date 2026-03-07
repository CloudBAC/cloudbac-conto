import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // 1. Add new columns to transactions_rels FIRST (before dropping from_party/to_party)
  await db.run(sql`ALTER TABLE \`transactions_rels\` ADD \`parties_id\` text(36) REFERENCES parties(id);`)
  await db.run(sql`ALTER TABLE \`transactions_rels\` ADD \`categories_id\` text(36) REFERENCES categories(id);`)
  await db.run(sql`CREATE INDEX \`transactions_rels_parties_id_idx\` ON \`transactions_rels\` (\`parties_id\`);`)
  await db.run(sql`CREATE INDEX \`transactions_rels_categories_id_idx\` ON \`transactions_rels\` (\`categories_id\`);`)

  // 2. Migrate existing from_party_id / to_party_id data into transactions_rels
  await db.run(sql`INSERT INTO \`transactions_rels\` (\`parent_id\`, \`path\`, \`parties_id\`, \`order\`)
    SELECT \`id\`, 'fromParty', \`from_party_id\`, 1 FROM \`transactions\` WHERE \`from_party_id\` IS NOT NULL;`)
  await db.run(sql`INSERT INTO \`transactions_rels\` (\`parent_id\`, \`path\`, \`parties_id\`, \`order\`)
    SELECT \`id\`, 'toParty', \`to_party_id\`, 1 FROM \`transactions\` WHERE \`to_party_id\` IS NOT NULL;`)

  // 3. Recreate transactions table without from_party_id / to_party_id (now polymorphic via rels)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_transactions\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`amount\` numeric NOT NULL,
  	\`date\` text NOT NULL,
  	\`organization_id\` text(36) NOT NULL,
  	\`project_id\` text(36),
  	\`main_party_from_id\` text(36),
  	\`main_party_to_id\` text(36),
  	\`transfer_type\` text NOT NULL,
  	\`remarks\` text,
  	\`to_be_reviewed\` integer DEFAULT true,
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`organization_id\`) REFERENCES \`organizations\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`main_party_from_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`main_party_to_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`INSERT INTO \`__new_transactions\`("id", "amount", "date", "organization_id", "project_id", "main_party_from_id", "main_party_to_id", "transfer_type", "remarks", "to_be_reviewed", "updated_at", "created_at") SELECT "id", "amount", "date", "organization_id", "project_id", "main_party_from_id", "main_party_to_id", "transfer_type", "remarks", "to_be_reviewed", "updated_at", "created_at" FROM \`transactions\`;`)
  await db.run(sql`DROP TABLE \`transactions\`;`)
  await db.run(sql`ALTER TABLE \`__new_transactions\` RENAME TO \`transactions\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`transactions_organization_idx\` ON \`transactions\` (\`organization_id\`);`)
  await db.run(sql`CREATE INDEX \`transactions_project_idx\` ON \`transactions\` (\`project_id\`);`)
  await db.run(sql`CREATE INDEX \`transactions_main_party_from_idx\` ON \`transactions\` (\`main_party_from_id\`);`)
  await db.run(sql`CREATE INDEX \`transactions_main_party_to_idx\` ON \`transactions\` (\`main_party_to_id\`);`)
  await db.run(sql`CREATE INDEX \`transactions_updated_at_idx\` ON \`transactions\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`transactions_created_at_idx\` ON \`transactions\` (\`created_at\`);`)

  // 4. Other schema changes
  await db.run(sql`ALTER TABLE \`users\` ADD \`name\` text;`)
  await db.run(sql`ALTER TABLE \`users\` ADD \`phone\` text;`)
  await db.run(sql`ALTER TABLE \`categories\` ADD \`type\` text DEFAULT 'party' NOT NULL;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_transactions_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` text(36) NOT NULL,
  	\`path\` text NOT NULL,
  	\`media_id\` text(36),
  	\`users_id\` text(36),
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`transactions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_transactions_rels\`("id", "order", "parent_id", "path", "media_id", "users_id") SELECT "id", "order", "parent_id", "path", "media_id", "users_id" FROM \`transactions_rels\`;`)
  await db.run(sql`DROP TABLE \`transactions_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_transactions_rels\` RENAME TO \`transactions_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`transactions_rels_order_idx\` ON \`transactions_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`transactions_rels_parent_idx\` ON \`transactions_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`transactions_rels_path_idx\` ON \`transactions_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`transactions_rels_media_id_idx\` ON \`transactions_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`transactions_rels_users_id_idx\` ON \`transactions_rels\` (\`users_id\`);`)
  await db.run(sql`ALTER TABLE \`transactions\` ADD \`from_party_id\` text(36) NOT NULL REFERENCES parties(id);`)
  await db.run(sql`ALTER TABLE \`transactions\` ADD \`to_party_id\` text(36) NOT NULL REFERENCES parties(id);`)
  await db.run(sql`CREATE INDEX \`transactions_from_party_idx\` ON \`transactions\` (\`from_party_id\`);`)
  await db.run(sql`CREATE INDEX \`transactions_to_party_idx\` ON \`transactions\` (\`to_party_id\`);`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`name\`;`)
  await db.run(sql`ALTER TABLE \`users\` DROP COLUMN \`phone\`;`)
  await db.run(sql`ALTER TABLE \`categories\` DROP COLUMN \`type\`;`)
}
