import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`CREATE TABLE \`invoices_line_items\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`description\` text NOT NULL,
  	\`quantity\` numeric DEFAULT 1 NOT NULL,
  	\`rate\` numeric NOT NULL,
  	\`amount\` numeric,
  	\`tax_type_id\` text(36),
  	FOREIGN KEY (\`tax_type_id\`) REFERENCES \`taxes\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`invoices\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`invoices_line_items_order_idx\` ON \`invoices_line_items\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`invoices_line_items_parent_id_idx\` ON \`invoices_line_items\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`invoices_line_items_tax_type_idx\` ON \`invoices_line_items\` (\`tax_type_id\`);`)
  await db.run(sql`CREATE TABLE \`invoices_taxes\` (
  	\`_order\` integer NOT NULL,
  	\`_parent_id\` text(36) NOT NULL,
  	\`id\` text PRIMARY KEY NOT NULL,
  	\`tax_type_id\` text(36) NOT NULL,
  	\`tax_amount\` numeric NOT NULL,
  	FOREIGN KEY (\`tax_type_id\`) REFERENCES \`taxes\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`_parent_id\`) REFERENCES \`invoices\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`CREATE INDEX \`invoices_taxes_order_idx\` ON \`invoices_taxes\` (\`_order\`);`)
  await db.run(sql`CREATE INDEX \`invoices_taxes_parent_id_idx\` ON \`invoices_taxes\` (\`_parent_id\`);`)
  await db.run(sql`CREATE INDEX \`invoices_taxes_tax_type_idx\` ON \`invoices_taxes\` (\`tax_type_id\`);`)
  await db.run(sql`CREATE TABLE \`invoices\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`invoice_number\` text,
  	\`type\` text DEFAULT 'sales' NOT NULL,
  	\`status\` text DEFAULT 'draft' NOT NULL,
  	\`party_id\` text(36) NOT NULL,
  	\`organization_id\` text(36) NOT NULL,
  	\`project_id\` text(36),
  	\`issue_date\` text NOT NULL,
  	\`due_date\` text NOT NULL,
  	\`payment_terms\` text DEFAULT 'net_30',
  	\`subtotal\` numeric DEFAULT 0,
  	\`total_amount\` numeric DEFAULT 0,
  	\`paid_amount\` numeric DEFAULT 0,
  	\`balance_due\` numeric DEFAULT 0,
  	\`notes\` text,
  	\`created_by_id\` text(36),
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`party_id\`) REFERENCES \`parties\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`organization_id\`) REFERENCES \`organizations\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`project_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`created_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE UNIQUE INDEX \`invoices_invoice_number_idx\` ON \`invoices\` (\`invoice_number\`);`)
  await db.run(sql`CREATE INDEX \`invoices_party_idx\` ON \`invoices\` (\`party_id\`);`)
  await db.run(sql`CREATE INDEX \`invoices_organization_idx\` ON \`invoices\` (\`organization_id\`);`)
  await db.run(sql`CREATE INDEX \`invoices_project_idx\` ON \`invoices\` (\`project_id\`);`)
  await db.run(sql`CREATE INDEX \`invoices_created_by_idx\` ON \`invoices\` (\`created_by_id\`);`)
  await db.run(sql`CREATE INDEX \`invoices_updated_at_idx\` ON \`invoices\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`invoices_created_at_idx\` ON \`invoices\` (\`created_at\`);`)
  await db.run(sql`CREATE TABLE \`invoice_payments\` (
  	\`id\` text(36) PRIMARY KEY NOT NULL,
  	\`invoice_id\` text(36) NOT NULL,
  	\`transaction_id\` text(36) NOT NULL,
  	\`allocated_amount\` numeric NOT NULL,
  	\`organization_id\` text(36) NOT NULL,
  	\`created_by_id\` text(36),
  	\`updated_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	\`created_at\` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
  	FOREIGN KEY (\`invoice_id\`) REFERENCES \`invoices\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`transaction_id\`) REFERENCES \`transactions\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`organization_id\`) REFERENCES \`organizations\`(\`id\`) ON UPDATE no action ON DELETE set null,
  	FOREIGN KEY (\`created_by_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE set null
  );
  `)
  await db.run(sql`CREATE INDEX \`invoice_payments_invoice_idx\` ON \`invoice_payments\` (\`invoice_id\`);`)
  await db.run(sql`CREATE INDEX \`invoice_payments_transaction_idx\` ON \`invoice_payments\` (\`transaction_id\`);`)
  await db.run(sql`CREATE INDEX \`invoice_payments_organization_idx\` ON \`invoice_payments\` (\`organization_id\`);`)
  await db.run(sql`CREATE INDEX \`invoice_payments_created_by_idx\` ON \`invoice_payments\` (\`created_by_id\`);`)
  await db.run(sql`CREATE INDEX \`invoice_payments_updated_at_idx\` ON \`invoice_payments\` (\`updated_at\`);`)
  await db.run(sql`CREATE INDEX \`invoice_payments_created_at_idx\` ON \`invoice_payments\` (\`created_at\`);`)
  await db.run(sql`ALTER TABLE \`organizations\` ADD \`invoice_prefix\` text;`)
  await db.run(sql`ALTER TABLE \`organizations\` ADD \`invoice_next_number\` numeric DEFAULT 1;`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`invoices_id\` text(36) REFERENCES invoices(id);`)
  await db.run(sql`ALTER TABLE \`payload_locked_documents_rels\` ADD \`invoice_payments_id\` text(36) REFERENCES invoice_payments(id);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_invoices_id_idx\` ON \`payload_locked_documents_rels\` (\`invoices_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_invoice_payments_id_idx\` ON \`payload_locked_documents_rels\` (\`invoice_payments_id\`);`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`DROP TABLE \`invoices_line_items\`;`)
  await db.run(sql`DROP TABLE \`invoices_taxes\`;`)
  await db.run(sql`DROP TABLE \`invoices\`;`)
  await db.run(sql`DROP TABLE \`invoice_payments\`;`)
  await db.run(sql`PRAGMA foreign_keys=OFF;`)
  await db.run(sql`CREATE TABLE \`__new_payload_locked_documents_rels\` (
  	\`id\` integer PRIMARY KEY NOT NULL,
  	\`order\` integer,
  	\`parent_id\` text(36) NOT NULL,
  	\`path\` text NOT NULL,
  	\`organizations_id\` text(36),
  	\`users_id\` text(36),
  	\`media_id\` text(36),
  	\`projects_id\` text(36),
  	\`parties_id\` text(36),
  	\`categories_id\` text(36),
  	\`transactions_id\` text(36),
  	\`taxes_id\` text(36),
  	FOREIGN KEY (\`parent_id\`) REFERENCES \`payload_locked_documents\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`organizations_id\`) REFERENCES \`organizations\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`users_id\`) REFERENCES \`users\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`media_id\`) REFERENCES \`media\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`projects_id\`) REFERENCES \`projects\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`parties_id\`) REFERENCES \`parties\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`categories_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`transactions_id\`) REFERENCES \`transactions\`(\`id\`) ON UPDATE no action ON DELETE cascade,
  	FOREIGN KEY (\`taxes_id\`) REFERENCES \`taxes\`(\`id\`) ON UPDATE no action ON DELETE cascade
  );
  `)
  await db.run(sql`INSERT INTO \`__new_payload_locked_documents_rels\`("id", "order", "parent_id", "path", "organizations_id", "users_id", "media_id", "projects_id", "parties_id", "categories_id", "transactions_id", "taxes_id") SELECT "id", "order", "parent_id", "path", "organizations_id", "users_id", "media_id", "projects_id", "parties_id", "categories_id", "transactions_id", "taxes_id" FROM \`payload_locked_documents_rels\`;`)
  await db.run(sql`DROP TABLE \`payload_locked_documents_rels\`;`)
  await db.run(sql`ALTER TABLE \`__new_payload_locked_documents_rels\` RENAME TO \`payload_locked_documents_rels\`;`)
  await db.run(sql`PRAGMA foreign_keys=ON;`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_order_idx\` ON \`payload_locked_documents_rels\` (\`order\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parent_idx\` ON \`payload_locked_documents_rels\` (\`parent_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_path_idx\` ON \`payload_locked_documents_rels\` (\`path\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_organizations_id_idx\` ON \`payload_locked_documents_rels\` (\`organizations_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_users_id_idx\` ON \`payload_locked_documents_rels\` (\`users_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_media_id_idx\` ON \`payload_locked_documents_rels\` (\`media_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_projects_id_idx\` ON \`payload_locked_documents_rels\` (\`projects_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_parties_id_idx\` ON \`payload_locked_documents_rels\` (\`parties_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_categories_id_idx\` ON \`payload_locked_documents_rels\` (\`categories_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_transactions_id_idx\` ON \`payload_locked_documents_rels\` (\`transactions_id\`);`)
  await db.run(sql`CREATE INDEX \`payload_locked_documents_rels_taxes_id_idx\` ON \`payload_locked_documents_rels\` (\`taxes_id\`);`)
  await db.run(sql`ALTER TABLE \`organizations\` DROP COLUMN \`invoice_prefix\`;`)
  await db.run(sql`ALTER TABLE \`organizations\` DROP COLUMN \`invoice_next_number\`;`)
}
