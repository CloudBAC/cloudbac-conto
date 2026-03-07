import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-d1-sqlite'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`parties\` ADD \`contact_person_name\` text;`)
  await db.run(sql`ALTER TABLE \`parties\` ADD \`contact_person_email\` text;`)
  await db.run(sql`ALTER TABLE \`parties\` ADD \`contact_person_phone\` text;`)
  await db.run(sql`ALTER TABLE \`parties\` ADD \`gst_number\` text;`)
  await db.run(sql`ALTER TABLE \`parties\` ADD \`pan_number\` text;`)
  await db.run(sql`ALTER TABLE \`parties\` ADD \`company_address_street\` text;`)
  await db.run(sql`ALTER TABLE \`parties\` ADD \`company_address_city\` text;`)
  await db.run(sql`ALTER TABLE \`parties\` ADD \`company_address_state\` text;`)
  await db.run(sql`ALTER TABLE \`parties\` ADD \`company_address_pincode\` text;`)
  await db.run(sql`ALTER TABLE \`parties\` ADD \`bank_details_account_number\` text;`)
  await db.run(sql`ALTER TABLE \`parties\` ADD \`bank_details_ifsc_code\` text;`)
  await db.run(sql`ALTER TABLE \`parties\` ADD \`bank_details_bank_name\` text;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.run(sql`ALTER TABLE \`parties\` DROP COLUMN \`contact_person_name\`;`)
  await db.run(sql`ALTER TABLE \`parties\` DROP COLUMN \`contact_person_email\`;`)
  await db.run(sql`ALTER TABLE \`parties\` DROP COLUMN \`contact_person_phone\`;`)
  await db.run(sql`ALTER TABLE \`parties\` DROP COLUMN \`gst_number\`;`)
  await db.run(sql`ALTER TABLE \`parties\` DROP COLUMN \`pan_number\`;`)
  await db.run(sql`ALTER TABLE \`parties\` DROP COLUMN \`company_address_street\`;`)
  await db.run(sql`ALTER TABLE \`parties\` DROP COLUMN \`company_address_city\`;`)
  await db.run(sql`ALTER TABLE \`parties\` DROP COLUMN \`company_address_state\`;`)
  await db.run(sql`ALTER TABLE \`parties\` DROP COLUMN \`company_address_pincode\`;`)
  await db.run(sql`ALTER TABLE \`parties\` DROP COLUMN \`bank_details_account_number\`;`)
  await db.run(sql`ALTER TABLE \`parties\` DROP COLUMN \`bank_details_ifsc_code\`;`)
  await db.run(sql`ALTER TABLE \`parties\` DROP COLUMN \`bank_details_bank_name\`;`)
}
