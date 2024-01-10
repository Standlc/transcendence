echo "import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Migration code
}

export async function down(db: Kysely<any>): Promise<void> {
  // Migration code
}" > ./src/migrations/migrations/"$(date +"%Y-%m-%dT%H:%M:%S").ts"
