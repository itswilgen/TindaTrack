import mysql from "mysql2/promise";
import { env } from "./env";

const db = mysql.createPool({
  host: env.database.host,
  port: env.database.port,
  user: env.database.user,
  password: env.database.password,
  database: env.database.name,
  waitForConnections: true,
  connectionLimit: env.database.connectionLimit,
  queueLimit: 0,
  ssl: env.database.ssl ? { rejectUnauthorized: true } : undefined,
});

export async function testDatabaseConnection() {
  try {
    const connection = await db.getConnection();
    console.log("MySQL database connected successfully");
    connection.release();
  } catch (error) {
    console.error("MySQL connection failed:", error);
    process.exit(1);
  }
}

export default db;
