import db from "../config/db";
import { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";

export type UserRow = RowDataPacket & {
  id: number;
  firebase_uid: string | null;
  name: string;
  email: string;
  phone: string | null;
  password_hash: string | null;
  global_role: "super_admin" | "business_user";
  status: "active" | "inactive" | "suspended";
};

export async function createUser(
  connection: PoolConnection,
  data: {
    firebase_uid?: string | null;
    name: string;
    email: string;
    phone?: string | null;
    password_hash?: string | null;
  }
) {
  const [result] = await connection.query<ResultSetHeader>(
    `
    INSERT INTO users (
      firebase_uid,
      name,
      email,
      phone,
      password_hash,
      global_role,
      status
    )
    VALUES (?, ?, ?, ?, ?, 'business_user', 'active')
    `,
    [
      data.firebase_uid || null,
      data.name,
      data.email,
      data.phone || null,
      data.password_hash || null,
    ]
  );

  return result.insertId;
}

export async function findUserByIdentifier(identifier: string) {
  const [rows] = await db.query<UserRow[]>(
    `SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1`,
    [identifier, identifier]
  );

  return rows[0] || null;
}

export async function findUserByPhone(phone: string) {
  const [rows] = await db.query<UserRow[]>(
    `SELECT * FROM users WHERE phone = ? LIMIT 1`,
    [phone]
  );

  return rows[0] || null;
}

export async function findUserByEmail(email: string) {
  const [rows] = await db.query<UserRow[]>(
    `
    SELECT *
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
    [email]
  );

  return rows[0] || null;
}

export async function findUserById(userId: number) {
  const [rows] = await db.query<UserRow[]>(
    "SELECT * FROM users WHERE id = ? LIMIT 1",
    [userId]
  );

  return rows[0] || null;
}
