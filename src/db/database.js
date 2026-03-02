// src/db/database.js
import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';

const db = SQLite.openDatabaseSync('kiosko.db');

async function hashPassword(password) {
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

// Helpers
async function safeExec(sql) {
  try {
    await db.execAsync(sql);
  } catch (e) {
    // Ignora errores típicos de "duplicate column" o "already exists"
    // pero si quieres verlos:
    // console.log('safeExec warning:', e?.message || e);
  }
}

export async function initDB() {
  await db.execAsync(`PRAGMA journal_mode = WAL;`);

  // Versionado simple para migraciones
  const vRows = await db.getAllAsync(`PRAGMA user_version;`);
  const userVersion = vRows?.[0]?.user_version ?? 0;

  // Tablas base (siempre)
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL
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
      employee_no INTEGER,             -- SOLO workers
      area TEXT,                       -- SOLO workers
      full_name TEXT NOT NULL,
      action TEXT NOT NULL,            -- 'ENTRADA' | 'SALIDA'
      reason TEXT,                     -- solo visitantes
      at TEXT NOT NULL                 -- ISO
    );
  `);

  // workers: si no existe, créala “nueva”
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_no INTEGER UNIQUE,
      full_name TEXT NOT NULL,
      area TEXT,
      email TEXT,
      face_key TEXT UNIQUE NOT NULL
    );
  `);

  // Migración si venías de esquema viejo (workers sin columnas)
  if (userVersion < 1) {
    // Agregar columnas si faltan (no truena si ya existen, por safeExec)
    await safeExec(`ALTER TABLE workers ADD COLUMN employee_no INTEGER;`);
    await safeExec(`ALTER TABLE workers ADD COLUMN area TEXT;`);
    await safeExec(`ALTER TABLE workers ADD COLUMN email TEXT;`);

    // Si employee_no está null, lo llenamos usando id (para no perder datos viejos)
    await safeExec(`UPDATE workers SET employee_no = id WHERE employee_no IS NULL;`);

    // Sube versión
    await db.execAsync(`PRAGMA user_version = 1;`);
  }
}

export async function ensureDefaultAdmin() {
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

// ✅ Crea trabajador con employee_no consecutivo automático
export async function createWorker({ fullName, area, email, faceKey }) {
  const name = (fullName || '').trim();
  const ar = (area || '').trim();
  const em = (email || '').trim();
  let fk = (faceKey || '').trim();

  if (!name) throw new Error('Nombre completo es obligatorio');
  if (!ar) throw new Error('Área es obligatoria');
  if (!em) throw new Error('Correo es obligatorio');

  // employee_no consecutivo
  const maxRows = await db.getAllAsync(`SELECT IFNULL(MAX(employee_no), 0) AS mx FROM workers;`);
  const nextNo = (maxRows?.[0]?.mx ?? 0) + 1;

  // Si no teclea faceKey, lo generamos automático (para que NO truene el NOT NULL)
  if (!fk) fk = `EMP_${String(nextNo).padStart(4, '0')}`;

  // duplicados
  const existFk = await db.getAllAsync(`SELECT id FROM workers WHERE face_key = ?`, [fk]);
  if (existFk.length > 0) throw new Error('Ese faceKey ya existe');

  const existEmail = await db.getAllAsync(`SELECT id FROM workers WHERE email = ?`, [em]);
  if (existEmail.length > 0) throw new Error('Ese correo ya está registrado');

  await db.runAsync(
    `INSERT INTO workers (employee_no, full_name, area, email, face_key)
     VALUES (?, ?, ?, ?, ?)`,
    [nextNo, name, ar, em, fk]
  );

  return { employee_no: nextNo, full_name: name, area: ar, email: em, face_key: fk };
}

export async function getWorkers() {
  return await db.getAllAsync(`SELECT * FROM workers ORDER BY employee_no ASC`);
}

export async function logWorker(faceKey, action) {
  const fk = (faceKey || '').trim();
  const rows = await db.getAllAsync(`SELECT * FROM workers WHERE face_key = ?`, [fk]);
  if (rows.length === 0) return null;

  const w = rows[0];
  const at = new Date().toISOString();

  await db.runAsync(
    `INSERT INTO logs (type, ref_id, employee_no, area, full_name, action, at)
     VALUES ('WORKER', ?, ?, ?, ?, ?, ?)`,
    [w.id, w.employee_no, w.area, w.full_name, action, at]
  );

  return w; // regresamos todo para mostrarlo bonito
}

export async function registerVisitor(fullName, reason) {
  const name = (fullName || '').trim();
  const r = (reason || '').trim();
  if (!name || !r) throw new Error('Nombre y motivo son obligatorios');

  const at = new Date().toISOString();

  const res = await db.runAsync(
    `INSERT INTO visitors (full_name, reason, created_at) VALUES (?, ?, ?)`,
    [name, r, at]
  );

  await db.runAsync(
    `INSERT INTO logs (type, ref_id, full_name, action, reason, at)
     VALUES ('VISITOR', ?, ?, 'ENTRADA', ?, ?)`,
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
    `INSERT INTO logs (type, ref_id, full_name, action, reason, at)
     VALUES ('VISITOR', ?, ?, 'SALIDA', ?, ?)`,
    [v.id, v.full_name, v.reason, at]
  );
}

export async function getLogs(type) {
  return await db.getAllAsync(
    `SELECT * FROM logs WHERE type = ? ORDER BY at DESC`,
    [type]
  );
}