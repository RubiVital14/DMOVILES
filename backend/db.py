import sqlite3
from pathlib import Path
from typing import Optional

DB_PATH = Path(__file__).resolve().parent / "kiosko.db"

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_conn()
    cur = conn.cursor()

    # tablas base
    cur.executescript("""
    PRAGMA journal_mode=WAL;

    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_no INTEGER UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      area TEXT NOT NULL,
      email TEXT,
      face_key TEXT
    );

    CREATE TABLE IF NOT EXISTS visitors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,        -- WORKER | VISITOR
      ref_id INTEGER NOT NULL,   -- workers.id o visitors.id
      employee_no INTEGER,       -- solo worker
      full_name TEXT NOT NULL,
      area TEXT,                 -- solo worker
      action TEXT NOT NULL,      -- ENTRADA | SALIDA
      reason TEXT,               -- solo visitor
      at TEXT NOT NULL           -- ISO datetime
    );
    """)

    # admin default
    cur.execute("SELECT id FROM admins WHERE username=?", ("admin",))
    if cur.fetchone() is None:
        cur.execute("INSERT INTO admins(username,password) VALUES(?,?)", ("admin", "1234"))

    conn.commit()
    conn.close()

def next_employee_no(conn: sqlite3.Connection) -> int:
    cur = conn.cursor()
    cur.execute("SELECT COALESCE(MAX(employee_no), 0) + 1 AS next_no FROM workers")
    return int(cur.fetchone()["next_no"])

def create_worker(full_name: str, area: str, email: Optional[str], face_key: Optional[str]):
    conn = get_conn()
    cur = conn.cursor()

    emp_no = next_employee_no(conn)

    cur.execute("""
      INSERT INTO workers(employee_no, full_name, area, email, face_key)
      VALUES(?,?,?,?,?)
    """, (emp_no, full_name.strip(), area.strip(), (email or "").strip() or None, (face_key or "").strip() or None))

    conn.commit()
    worker_id = cur.lastrowid
    conn.close()
    return worker_id, emp_no

def list_workers():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, employee_no, full_name, area, email, face_key FROM workers ORDER BY employee_no ASC")
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

def add_worker_log(employee_no: int, action: str, at_iso: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM workers WHERE employee_no=?", (employee_no,))
    w = cur.fetchone()
    if w is None:
        conn.close()
        return None

    cur.execute("""
      INSERT INTO logs(type, ref_id, employee_no, full_name, area, action, at)
      VALUES('WORKER', ?, ?, ?, ?, ?, ?)
    """, (w["id"], w["employee_no"], w["full_name"], w["area"], action, at_iso))

    conn.commit()
    conn.close()
    return w["full_name"]

def register_visitor(full_name: str, reason: str, at_iso: str):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
      INSERT INTO visitors(full_name, reason, created_at)
      VALUES(?,?,?)
    """, (full_name.strip(), reason.strip(), at_iso))
    visitor_id = cur.lastrowid

    cur.execute("""
      INSERT INTO logs(type, ref_id, full_name, action, reason, at)
      VALUES('VISITOR', ?, ?, 'ENTRADA', ?, ?)
    """, (visitor_id, full_name.strip(), reason.strip(), at_iso))

    conn.commit()
    conn.close()
    return visitor_id

def visitor_exit(visitor_id: int, at_iso: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM visitors WHERE id=?", (visitor_id,))
    v = cur.fetchone()
    if v is None:
        conn.close()
        return False

    cur.execute("""
      INSERT INTO logs(type, ref_id, full_name, action, reason, at)
      VALUES('VISITOR', ?, ?, 'SALIDA', ?, ?)
    """, (v["id"], v["full_name"], v["reason"], at_iso))

    conn.commit()
    conn.close()
    return True

def admin_login(username: str, password: str) -> bool:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM admins WHERE username=? AND password=?", (username.strip(), password.strip()))
    ok = cur.fetchone() is not None
    conn.close()
    return ok

def build_logs_query(filters: dict):
    where = []
    params = []

    # filtros
    if filters.get("type"):
        where.append("type=?")
        params.append(filters["type"])

    if filters.get("action"):
        where.append("action=?")
        params.append(filters["action"])

    if filters.get("name"):
        where.append("LOWER(full_name) LIKE ?")
        params.append(f"%{filters['name'].lower()}%")

    if filters.get("area"):
        where.append("LOWER(area) LIKE ?")
        params.append(f"%{filters['area'].lower()}%")

    if filters.get("employee_no"):
        where.append("employee_no = ?")
        params.append(int(filters["employee_no"]))

    if filters.get("from"):
        where.append("at >= ?")
        params.append(filters["from"])

    if filters.get("to"):
        where.append("at <= ?")
        params.append(filters["to"])

    sql = "SELECT * FROM logs"
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY id DESC"

    return sql, params

def get_logs(filters: dict):
    conn = get_conn()
    cur = conn.cursor()
    sql, params = build_logs_query(filters)
    cur.execute(sql, params)
    rows = [dict(r) for r in cur.fetchall()]
    conn.close()
    return rows

    from datetime import datetime

def _parse_iso(s: str) -> datetime:
    # soporta "Z" si llega
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    return datetime.fromisoformat(s)

def get_concentrado(filters: dict):
    """
    Devuelve filas tipo "asistencia": una fila por persona por día
    con entrada/salida emparejadas (primera entrada y última salida del día).
    """
    rows = get_logs(filters)  # ya trae orden DESC por id
    # para asistencia conviene orden ASC por tiempo
    rows = sorted(rows, key=lambda r: r["at"])

    buckets = {}  # key = (type, ref_id, date)

    for r in rows:
      at_dt = _parse_iso(r["at"])
      date_key = at_dt.date().isoformat()
      key = (r["type"], r["ref_id"], date_key)

      b = buckets.get(key)
      if not b:
        b = {
          "type": r["type"],
          "ref_id": r["ref_id"],
          "employee_no": r.get("employee_no"),
          "full_name": r.get("full_name"),
          "area": r.get("area"),
          "reason": r.get("reason"),
          "date": date_key,
          "entrada_at": None,
          "salida_at": None,
        }
        buckets[key] = b

      if r["action"] == "ENTRADA":
        # primera entrada del día
        if b["entrada_at"] is None or _parse_iso(r["at"]) < _parse_iso(b["entrada_at"]):
          b["entrada_at"] = r["at"]

      if r["action"] == "SALIDA":
        # última salida del día
        if b["salida_at"] is None or _parse_iso(r["at"]) > _parse_iso(b["salida_at"]):
          b["salida_at"] = r["at"]

    # convertir a lista
    out = []
    for _, b in buckets.items():
      entrada_time = _parse_iso(b["entrada_at"]).time().isoformat() if b["entrada_at"] else None
      salida_time = _parse_iso(b["salida_at"]).time().isoformat() if b["salida_at"] else None

      out.append({
        "type": b["type"],
        "employee_no": b["employee_no"],
        "full_name": b["full_name"],
        "area": b["area"],
        "date": b["date"],
        "entrada_time": entrada_time,
        "salida_time": salida_time,
        "entrada_at": b["entrada_at"],
        "salida_at": b["salida_at"],
        "reason": b["reason"],
      })

    # orden bonito: fecha desc, employee_no asc
    out.sort(key=lambda r: (r["date"], r["employee_no"] or 0, r["full_name"] or ""), reverse=True)
    return out