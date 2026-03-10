import sqlite3
from datetime import datetime

DB_NAME = "kiosko.db"


def get_conn():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn


def row_to_dict(row):
    return dict(row) if row else None


def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
    CREATE TABLE IF NOT EXISTS workers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        employee_no INTEGER UNIQUE,
        full_name TEXT NOT NULL,
        area TEXT NOT NULL,
        email TEXT,
        face_key TEXT,
        created_at TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        worker_id INTEGER,
        employee_no INTEGER,
        full_name TEXT,
        area TEXT,
        action TEXT,
        log_type TEXT,
        method TEXT,
        created_at TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS visitors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        company TEXT,
        phone TEXT,
        reason TEXT,
        photo_uri TEXT,
        created_at TEXT
    )
    """)

    cur.execute("""
    CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT
    )
    """)

    conn.commit()

    # admin por defecto
    cur.execute("SELECT COUNT(*) AS total FROM admins")
    row = cur.fetchone()
    if row["total"] == 0:
        cur.execute("""
            INSERT INTO admins (username, password, created_at)
            VALUES (?, ?, ?)
        """, ("admin", "admin123", datetime.now().isoformat(timespec="seconds")))
        conn.commit()

    conn.close()


# -------------------------
# WORKERS
# -------------------------

def list_workers():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, employee_no, full_name, area, email, face_key, created_at
        FROM workers
        ORDER BY employee_no ASC, id ASC
    """)
    rows = cur.fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


def get_next_employee_no():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT MAX(employee_no) AS max_no FROM workers")
    row = cur.fetchone()
    conn.close()

    max_no = row["max_no"] if row and row["max_no"] is not None else 0
    return int(max_no) + 1


def create_worker(full_name, area, email=None, face_key=None):
    employee_no = get_next_employee_no()
    created_at = datetime.now().isoformat(timespec="seconds")

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO workers (employee_no, full_name, area, email, face_key, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (employee_no, full_name, area, email, face_key, created_at))

    worker_id = cur.lastrowid
    conn.commit()

    cur.execute("""
        SELECT id, employee_no, full_name, area, email, face_key, created_at
        FROM workers
        WHERE id = ?
    """, (worker_id,))
    row = cur.fetchone()

    conn.close()
    return row_to_dict(row)


def update_worker(worker_id, full_name, area, email=None, face_key=None):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        UPDATE workers
        SET full_name = ?, area = ?, email = ?, face_key = ?
        WHERE id = ?
    """, (full_name, area, email, face_key, worker_id))

    conn.commit()

    cur.execute("""
        SELECT id, employee_no, full_name, area, email, face_key, created_at
        FROM workers
        WHERE id = ?
    """, (worker_id,))
    row = cur.fetchone()

    conn.close()
    return row_to_dict(row)


def delete_worker(worker_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM workers WHERE id = ?", (worker_id,))
    conn.commit()
    deleted = cur.rowcount
    conn.close()
    return deleted > 0


# -------------------------
# LOGS
# -------------------------

def create_log(worker_id, action, log_type="worker", method="Rostro"):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, employee_no, full_name, area
        FROM workers
        WHERE id = ?
    """, (worker_id,))
    worker = cur.fetchone()

    if not worker:
        conn.close()
        raise Exception("Trabajador no encontrado")

    created_at = datetime.now().isoformat(timespec="seconds")
    action_label = "Entrada" if str(action).upper() == "IN" else "Salida"

    cur.execute("""
        INSERT INTO logs (worker_id, employee_no, full_name, area, action, log_type, method, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        worker["id"],
        worker["employee_no"],
        worker["full_name"],
        worker["area"],
        action_label,
        log_type,
        method,
        created_at
    ))

    log_id = cur.lastrowid
    conn.commit()

    cur.execute("SELECT * FROM logs WHERE id = ?", (log_id,))
    row = cur.fetchone()
    conn.close()
    return row_to_dict(row)


def list_logs():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, worker_id, employee_no, full_name, area, action, log_type, method, created_at
        FROM logs
        ORDER BY id DESC
    """)
    rows = cur.fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


# -------------------------
# VISITORS
# -------------------------

def create_visitor(full_name, company=None, phone=None, reason=None, photo_uri=None):
    created_at = datetime.now().isoformat(timespec="seconds")

    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO visitors (full_name, company, phone, reason, photo_uri, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (full_name, company, phone, reason, photo_uri, created_at))

    visitor_id = cur.lastrowid
    conn.commit()

    cur.execute("SELECT * FROM visitors WHERE id = ?", (visitor_id,))
    row = cur.fetchone()
    conn.close()
    return row_to_dict(row)


def list_visitors():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT *
        FROM visitors
        ORDER BY id DESC
    """)
    rows = cur.fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


# -------------------------
# ADMINS
# -------------------------

def list_admins():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, username, created_at
        FROM admins
        ORDER BY id DESC
    """)
    rows = cur.fetchall()
    conn.close()
    return [row_to_dict(r) for r in rows]


def admin_login(username, password):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        SELECT id, username, password, created_at
        FROM admins
        WHERE username = ?
    """, (username,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return None
    if row["password"] != password:
        return None
    return row_to_dict(row)


def create_admin(username, password):
    conn = get_conn()
    cur = conn.cursor()
    created_at = datetime.now().isoformat(timespec="seconds")

    cur.execute("""
        INSERT INTO admins (username, password, created_at)
        VALUES (?, ?, ?)
    """, (username, password, created_at))

    admin_id = cur.lastrowid
    conn.commit()

    cur.execute("""
        SELECT id, username, created_at
        FROM admins
        WHERE id = ?
    """, (admin_id,))
    row = cur.fetchone()

    conn.close()
    return row_to_dict(row)


def change_admin_password(username, current_password, new_password):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT id, username, password
        FROM admins
        WHERE username = ?
    """, (username,))
    row = cur.fetchone()

    if not row:
        conn.close()
        raise Exception("Administrador no encontrado")

    if row["password"] != current_password:
        conn.close()
        raise Exception("La contraseña actual es incorrecta")

    cur.execute("""
        UPDATE admins
        SET password = ?
        WHERE username = ?
    """, (new_password, username))
    conn.commit()
    conn.close()
    return True