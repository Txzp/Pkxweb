import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

const globalForDb = globalThis as unknown as { pool?: Pool }

export const pool = globalForDb.pool ?? new Pool({ connectionString: process.env.DATABASE_URL })
if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool

export const db = drizzle(pool)
export async function sql<T extends Record<string, unknown> = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]) {
  const text = strings.reduce((result, part, index) => result + part + (index < values.length ? `$${index + 1}` : ''), '')
  const result = await pool.query<T>(text, values)
  return { rows: result.rows, rowCount: result.rowCount ?? 0 }
}
