import mysql from "mysql2/promise";

declare global {
  var triaigeMysqlPool: mysql.Pool | undefined;
}

function createPool() {
  const common = {
    waitForConnections: true, connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10), queueLimit: 0,
    timezone: "Z", dateStrings: true,
    ...(process.env.DB_SSL === "true" ? { ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } } : {}),
  };
  if (process.env.DATABASE_URL) return mysql.createPool({ uri: process.env.DATABASE_URL, ...common });
  return mysql.createPool({
    host: process.env.DB_HOST ?? "127.0.0.1", port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root", password: process.env.DB_PASSWORD ?? "", database: process.env.DB_NAME ?? "triaige",
    ...common,
  });
}

function createUtcPool() {
  const pool = createPool();
  // Stored DATETIMEs are UTC; NOW(3)/CURRENT_TIMESTAMP must agree regardless of the server time zone.
  pool.pool.on("connection", (conn) => conn.query("SET time_zone = '+00:00'"));
  return pool;
}

export const db = global.triaigeMysqlPool ?? createUtcPool();
if (process.env.NODE_ENV !== "production") global.triaigeMysqlPool = db;

export async function withTransaction<T>(work: (conn: mysql.PoolConnection) => Promise<T>): Promise<T> {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const result = await work(conn);
    await conn.commit();
    return result;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

