import { Pool } from 'pg'

const globalForPg = globalThis as typeof globalThis & { pgPool?: Pool }

export const db = globalForPg.pgPool ?? new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
})

if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = db
