from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import io
from openpyxl import Workbook

from db import (
    init_db, admin_login,
    create_worker, list_workers,
    add_worker_log, register_visitor, visitor_exit,
    get_logs, get_concentrado
)

@app.get("/export/concentrado.xlsx")
def export_concentrado_xlsx(
    type: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    employee_no: Optional[int] = Query(None),
    from_: Optional[str] = Query(None, alias="from"),
    to: Optional[str] = Query(None),
):
    rows = get_concentrado({
        "type": type,
        "name": name,
        "area": area,
        "employee_no": employee_no,
        "from": from_,
        "to": to
    })

    wb = Workbook()
    ws = wb.active
    ws.title = "concentrado"

    headers = [
      "type","employee_no","full_name","area","date",
      "entrada_time","salida_time","entrada_at","salida_at","reason"
    ]
    ws.append(headers)

    for r in rows:
      ws.append([r.get(h) for h in headers])

    # filtros y congelar encabezado
    ws.freeze_panes = "A2"
    last_row = ws.max_row
    last_col = ws.max_column
    if last_row >= 1:
      ws.auto_filter.ref = f"A1:{chr(64+last_col)}{last_row}"

    bio = io.BytesIO()
    wb.save(bio)
    bio.seek(0)

    return StreamingResponse(
        bio,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=concentrado.xlsx"},
    )

app = FastAPI()

# CORS para que tu app móvil pueda pegarle sin broncas
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # para dev está bien
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Models ----
class AdminLoginReq(BaseModel):
    username: str
    password: str

class CreateWorkerReq(BaseModel):
    full_name: str
    area: str
    email: Optional[str] = None
    face_key: Optional[str] = None

class WorkerLogReq(BaseModel):
    employee_no: int
    action: str  # ENTRADA | SALIDA

class VisitorReq(BaseModel):
    full_name: str
    reason: str

class VisitorExitReq(BaseModel):
    visitor_id: int

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/health")
def health():
    return {"ok": True}

# ---- Admin ----
@app.post("/admin/login")
def admin_login_api(req: AdminLoginReq):
    ok = admin_login(req.username, req.password)
    return {"ok": ok}

# ---- Workers ----
@app.post("/workers")
def create_worker_api(req: CreateWorkerReq):
    worker_id, emp_no = create_worker(req.full_name, req.area, req.email, req.face_key)
    return {"ok": True, "id": worker_id, "employee_no": emp_no}

@app.get("/workers")
def list_workers_api():
    return {"ok": True, "rows": list_workers()}

@app.post("/worker-log")
def worker_log_api(req: WorkerLogReq):
    at = datetime.utcnow().isoformat()
    name = add_worker_log(req.employee_no, req.action, at)
    if name is None:
        return {"ok": False, "error": "NOT_FOUND"}
    return {"ok": True, "name": name}

# ---- Visitors ----
@app.post("/visitors")
def register_visitor_api(req: VisitorReq):
    at = datetime.utcnow().isoformat()
    vid = register_visitor(req.full_name, req.reason, at)
    return {"ok": True, "visitor_id": vid}

@app.post("/visitors/exit")
def visitor_exit_api(req: VisitorExitReq):
    at = datetime.utcnow().isoformat()
    ok = visitor_exit(req.visitor_id, at)
    return {"ok": ok}

# ---- Logs (JSON + filtros) ----
@app.get("/logs")
def logs_api(
    type: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    employee_no: Optional[int] = Query(None),
    from_: Optional[str] = Query(None, alias="from"),
    to: Optional[str] = Query(None),
):
    rows = get_logs({
        "type": type,
        "action": action,
        "name": name,
        "area": area,
        "employee_no": employee_no,
        "from": from_,
        "to": to
    })
    return {"ok": True, "rows": rows}

# ---- Export Excel (mismos filtros) ----
@app.get("/export/logs.xlsx")
def export_logs_xlsx(
    type: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    area: Optional[str] = Query(None),
    employee_no: Optional[int] = Query(None),
    from_: Optional[str] = Query(None, alias="from"),
    to: Optional[str] = Query(None),
):
    rows = get_logs({
        "type": type,
        "action": action,
        "name": name,
        "area": area,
        "employee_no": employee_no,
        "from": from_,
        "to": to
    })

    wb = Workbook()
    ws = wb.active
    ws.title = "logs"

    if not rows:
        ws.append(["Sin resultados"])
    else:
        headers = list(rows[0].keys())
        ws.append(headers)
        for r in rows:
            ws.append([r.get(h) for h in headers])

    bio = io.BytesIO()
    wb.save(bio)
    bio.seek(0)

    return StreamingResponse(
        bio,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=logs.xlsx"},
    )