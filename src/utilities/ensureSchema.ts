import type { Payload } from 'payload'

let schemaVerified = false
let schemaPromise: Promise<void> | null = null

/**
 * Ensures that the Neon PostgreSQL media table has all required columns
 * expected by @payloadcms/storage-uploadthing and cloud-storage plugins (_objectkey, thumbnail_url, etc.)
 */
export async function ensureMediaSchema(payload: Payload): Promise<void> {
  if (schemaVerified) return

  if (!schemaPromise) {
    schemaPromise = (async () => {
      try {
        const pool = (payload.db as any)?.pool
        if (pool && typeof pool.query === 'function') {
          await pool.query(`
            ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_objectkey" character varying;
            ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "thumbnail_url" character varying;
            ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "thumbnail_u_r_l" character varying;
            ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "_key" character varying;
            ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "prefix" character varying DEFAULT 'media';
            DO $$
            BEGIN
              IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media' AND column_name = 'thumbnail_u_r_l')
                 AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'media' AND column_name = 'thumbnail_url') THEN
                UPDATE "media" SET "thumbnail_url" = "thumbnail_u_r_l" WHERE "thumbnail_url" IS NULL AND "thumbnail_u_r_l" IS NOT NULL;
                UPDATE "media" SET "thumbnail_u_r_l" = "thumbnail_url" WHERE "thumbnail_u_r_l" IS NULL AND "thumbnail_url" IS NOT NULL;
              END IF;
            END $$;
          `)
          schemaVerified = true
          payload.logger.info('Database schema verified: media columns up to date.')
        }
      } catch (err) {
        payload.logger.warn({ err }, 'Notice during ensureMediaSchema execution')
      } finally {
        schemaPromise = null
      }
    })()
  }

  await schemaPromise
}
