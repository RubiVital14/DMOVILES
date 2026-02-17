// src/db/database.js
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

const db = SQLite.openDatabaseSync('kiosko.db');

async function hashPassword(password) {
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

export async function initDB() {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      face_key TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,              -- 'WORKER' | 'VISITOR'
      ref_id INTEGER NOT NULL,         -- workers.id o visitors.id
      full_name TEXT NOT NULL,
      action TEXT NOT NULL,            -- 'ENTRADA' | 'SALIDA'
      reason TEXT,                     -- solo visitantes
      at TEXT NOT NULL                 -- ISO date
    );
  `);
}

export async function ensureDefaultAdmin() {
  // OJO: NO prefill en UI. Esto solo asegura que exista uno para pruebas.
  const rows = await db.getAllAsync(`SELECT id FROM admins WHERE username = ?`, ['admin']);
  if (rows.length === 0) {
    const ph = await hashPassword('1234');
    await db.runAsync(`INSERT INTO admins (username, password_hash) VALUES (?, ?)`, ['admin', ph]);
    console.log('✅ Admin inicial creado: admin / 1234');
  }
}

export async function adminLogin(username, password) {
  const u = username.trim();
  const ph = await hashPassword(password);
  const rows = await db.getAllAsync(
    `SELECT * FROM admins WHERE username = ? AND password_hash = ?`,
    [u, ph]
  );
  return rows.length > 0;
}

export async function createWorker(fullName, faceKey) {
  const name = fullName.trim();
  const fk = faceKey.trim();
  if (!name || !fk) throw new Error('Nombre y faceKey son obligatorios');

  // checar duplicado
  const exist = await db.getAllAsync(`SELECT id FROM workers WHERE face_key = ?`, [fk]);
  if (exist.length > 0) throw new Error('Ese faceKey ya existe');

  await db.runAsync(`INSERT INTO workers (full_name, face_key) VALUES (?, ?)`, [name, fk]);
}

export async function getWorkers() {
  return await db.getAllAsync(`SELECT * FROM workers ORDER BY full_name ASC`);
}

export async function logWorker(faceKey, action) {
  const fk = faceKey.trim();
  const rows = await db.getAllAsync(`SELECT * FROM workers WHERE face_key = ?`, [fk]);
  if (rows.length === 0) return null;

  const w = rows[0];
  const at = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO logs (type, ref_id, full_name, action, at) VALUES ('WORKER', ?, ?, ?, ?)`,
    [w.id, w.full_name, action, at]
  );

  return w.full_name;
}

export async function registerVisitor(fullName, reason) {
  const name = fullName.trim();
  const r = reason.trim();
  if (!name || !r) throw new Error('Nombre y motivo son obligatorios');

  const at = new Date().toISOString();

  const res = await db.runAsync(
    `INSERT INTO visitors (full_name, reason, created_at) VALUES (?, ?, ?)`,
    [name, r, at]
  );

  // ENTRADA visitante automáticamente al registrarse
  await db.runAsync(
    `INSERT INTO logs (type, ref_id, full_name, action, reason, at) VALUES ('VISITOR', ?, ?, 'ENTRADA', ?, ?)`,
    [res.lastInsertRowId, name, r, at]
  );

  return res.lastInsertRowId;
}

export async function visitorExit(visitorId) {
  const rows = await db.getAllAsync(`SELECT * FROM visitors WHERE id = ?`, [visitorId]);
  if (rows.length === 0) throw new Error('Visitante no encontrado');

  const v = rows[0];
  const at = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO logs (type, ref_id, full_name, action, reason, at) VALUES ('VISITOR', ?, ?, 'SALIDA', ?, ?)`,
    [v.id, v.full_name, v.reason, at]
  );
}

export async function getLogs(type) {
  // type: 'WORKER' | 'VISITOR'
  return await db.getAllAsync(
    `SELECT * FROM logs WHERE type = ? ORDER BY at DESC`,
    [type]
  );
}

// DEV helpers
export async function wipeAll() {
  await db.execAsync(`
    DELETE FROM logs;
    DELETE FROM visitors;
    DELETE FROM workers;
  `);
}