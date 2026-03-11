import sqlite3
from typing import Optional

DB_PATH = "kiosko.db"


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    cur = conn.cursor()

    # =========================
    # ADMINS
    # =========================
    cur.execute("""
        CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL
        )
    """)

    # =========================
    # WORKERS
    # =========================
    cur.execute("""
        CREATE TABLE IF NOT EXISTS workers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            employee_no TEXT NOT NULL UNIQUE,
            area TEXT NOT NULL,
            email TEXT,
            face_key TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # =========================
    # LOGS
    # =========================
    cur.execute("""
        CREATE TABLE IF NOT EXISTS logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            employee_no TEXT NOT NULL,
            area TEXT NOT NULL,
            action TEXT NOT NULL,
            method TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # =========================
    # VISITORS
    # =========================
    cur.execute("""
        CREATE TABLE IF NOT EXISTS visitors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            company TEXT,
            phone TEXT,
            reason TEXT,
            photo_uri TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()

    # admin por defecto
    cur.execute("SELECT * FROM admins WHERE username = ?", ("admin",))
    admin = cur.fetchone()
    if not admin:
        cur.execute(
            "INSERT INTO admins (username, password) VALUES (?, ?)",
            ("admin", "1234")
        )
        conn.commit()

    conn.close()


# =========================
# ADMINS
# =========================
def admin_login(username: str, password: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM admins WHERE username = ? AND password = ?",
        (username, password)
    )
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def create_admin(username: str, password: str):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id FROM admins WHERE username = ?", (username,))
    exists = cur.fetchone()
    if exists:
      conn.close()
      raise Exception("Ese usuario administrador ya existe")

    cur.execute(
        "INSERT INTO admins (username, password) VALUES (?, ?)",
        (username, password)
    )
    conn.commit()

    admin_id = cur.lastrowid
    cur.execute("SELECT * FROM admins WHERE id = ?", (admin_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def change_admin_password(username: str, current_password: str, new_password: str):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "SELECT * FROM admins WHERE username = ? AND password = ?",
        (username, current_password)
    )
    admin = cur.fetchone()

    if not admin:
        conn.close()
        raise Exception("Usuario o contraseña actual incorrectos")

    cur.execute(
        "UPDATE admins SET password = ? WHERE username = ?",
        (new_password, username)
    )
    conn.commit()
    conn.close()
    return {"ok": True}


# =========================
# WORKERS
# =========================
def _next_employee_no(conn) -> str:
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) as total FROM workers")
    total = cur.fetchone()["total"]
    return str(total + 1)


def list_workers():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, full_name, employee_no, area, email, face_key, created_at
        FROM workers
        ORDER BY id ASC
    """)
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_worker_by_id(worker_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, full_name, employee_no, area, email, face_key, created_at
        FROM workers
        WHERE id = ?
    """, (worker_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def get_worker_by_email(email: str):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, full_name, employee_no, area, email, face_key, created_at
        FROM workers
        WHERE lower(trim(email)) = lower(trim(?))
    """, (email,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def create_worker(data: dict):
    full_name = data.get("full_name", "").strip()
    area = data.get("area", "").strip()
    email = data.get("email", "").strip().lower()
    face_key = data.get("face_key")

    if not full_name:
        raise Exception("El nombre es obligatorio")
    if not area:
        raise Exception("El departamento es obligatorio")
    if not email:
        raise Exception("El correo es obligatorio")

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id FROM workers WHERE lower(trim(email)) = ?", (email,))
    email_exists = cur.fetchone()
    if email_exists:
        conn.close()
        raise Exception("Ya existe un trabajador con ese correo")

    employee_no = _next_employee_no(conn)

    cur.execute("""
        INSERT INTO workers (full_name, employee_no, area, email, face_key)
        VALUES (?, ?, ?, ?, ?)
    """, (full_name, employee_no, area, email, face_key))
    conn.commit()

    worker_id = cur.lastrowid
    cur.execute("""
        SELECT id, full_name, employee_no, area, email, face_key, created_at
        FROM workers
        WHERE id = ?
    """, (worker_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def update_worker(worker_id: int, body):
    full_name = body.full_name.strip()
    area = body.area.strip()
    email = body.email.strip().lower()
    face_key = body.face_key

    if not full_name:
        raise Exception("El nombre es obligatorio")
    if not area:
        raise Exception("El departamento es obligatorio")
    if not email:
        raise Exception("El correo es obligatorio")

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id FROM workers WHERE id = ?", (worker_id,))
    exists = cur.fetchone()
    if not exists:
        conn.close()
        return None

    cur.execute("""
        SELECT id FROM workers
        WHERE lower(trim(email)) = ?
        AND id != ?
    """, (email, worker_id))
    email_exists = cur.fetchone()
    if email_exists:
        conn.close()
        raise Exception("Otro trabajador ya usa ese correo")

    cur.execute("""
        UPDATE workers
        SET full_name = ?, area = ?, email = ?, face_key = ?
        WHERE id = ?
    """, (full_name, area, email, face_key, worker_id))
    conn.commit()

    cur.execute("""
        SELECT id, full_name, employee_no, area, email, face_key, created_at
        FROM workers
        WHERE id = ?
    """, (worker_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


def delete_worker(worker_id: int):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id FROM workers WHERE id = ?", (worker_id,))
    exists = cur.fetchone()
    if not exists:
        conn.close()
        return False

    cur.execute("DELETE FROM workers WHERE id = ?", (worker_id,))
    conn.commit()
    conn.close()
    return True


# =========================
# LOGS
# =========================
def list_logs():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, full_name, employee_no, area, action, method, created_at
        FROM logs
        ORDER BY id DESC
    """)
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_log(full_name: str, employee_no: str, area: str, action: str, method: str):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO logs (full_name, employee_no, area, action, method)
        VALUES (?, ?, ?, ?, ?)
    """, (full_name, employee_no, area, action, method))
    conn.commit()

    log_id = cur.lastrowid
    cur.execute("""
        SELECT id, full_name, employee_no, area, action, method, created_at
        FROM logs
        WHERE id = ?
    """, (log_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None


# =========================
# VISITORS
# =========================
def list_visitors():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, full_name, company, phone, reason, photo_uri, created_at
        FROM visitors
        ORDER BY id DESC
    """)
    rows = cur.fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_visitor(full_name: str, company: str, phone: str, reason: str, photo_uri: Optional[str]):
    full_name = (full_name or "").strip()
    company = (company or "").strip()
    phone = (phone or "").strip()
    reason = (reason or "").strip()

    if not full_name:
        raise Exception("El nombre del visitante es obligatorio")

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO visitors (full_name, company, phone, reason, photo_uri)
        VALUES (?, ?, ?, ?, ?)
    """, (full_name, company, phone, reason, photo_uri))
    conn.commit()

    visitor_id = cur.lastrowid
    cur.execute("""
        SELECT id, full_name, company, phone, reason, photo_uri, created_at
        FROM visitors
        WHERE id = ?
    """, (visitor_id,))
    row = cur.fetchone()
    conn.close()
    return dict(row) if row else None