import mysql from "mysql2/promise";

declare global {
  var triaigeMysqlPool: mysql.Pool | undefined;
}

function createPool() {
  if (process.env.DATABASE_URL) return mysql.createPool(process.env.DATABASE_URL);
  return mysql.createPool({
    host: process.env.DB_HOST ?? "127.0.0.1", port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER ?? "root", password: process.env.DB_PASSWORD ?? "", database: process.env.DB_NAME ?? "triaige",
    waitForConnections: true, connectionLimit: Number(process.env.DB_CONNECTION_LIMIT ?? 10), queueLimit: 0,
    timezone: "Z", dateStrings: true,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false" } : undefined,
  });
}

export const db = global.triaigeMysqlPool ?? createPool();
if (process.env.NODE_ENV !== "production") global.triaigeMysqlPool = db;

