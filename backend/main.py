import os
import random
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import resend

import db

load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
if not RESEND_API_KEY:
    raise Exception("RESEND_API_KEY no encontrada en .env")

resend.api_key = RESEND_API_KEY

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db.init_db()

OTP_STORE = {}
ADMIN_RESET_STORE = {}


# =========================
# MODELOS
# =========================
class SendOtpReq(BaseModel):
    worker_id: int
    action: str


class VerifyOtpReq(BaseModel):
    worker_id: int
    code: str
    action: str


class WorkerCreateReq(BaseModel):
    full_name: str
    area: str
    email: str
    face_key: Optional[str] = None


class WorkerUpdateReq(BaseModel):
    full_name: str
    area: str
    email: str
    face_key: Optional[str] = None


class VisitorCreateReq(BaseModel):
    full_name: str
    company: str = ""
    phone: str = ""
    reason: str = ""
    photo_uri: Optional[str] = None


class AdminLoginReq(BaseModel):
    username: str
    password: str


class AdminCreateReq(BaseModel):
    username: str
    password: str
    email: Optional[str] = None


class ChangePasswordReq(BaseModel):
    username: str
    current_password: str
    new_password: str


class ForgotAdminPasswordReq(BaseModel):
    email: str


class VerifyAdminResetReq(BaseModel):
    email: str
    code: str
    new_password: str


# =========================
# HELPERS
# =========================
def normalize_action(action: str) -> str:
    value = (action or "").strip().lower()

    if value in ["in", "entrada"]:
        return "Entrada"
    if value in ["out", "salida"]:
        return "Salida"

    return action


# =========================
# OTP WORKERS
# =========================
@app.post("/send-otp")
def send_otp(body: SendOtpReq):
    try:
        worker = db.get_worker_by_id(body.worker_id)
        if not worker:
            raise HTTPException(status_code=404, detail="Trabajador no encontrado")

        email = (worker.get("email") or "").strip().lower()
        if not email:
            raise HTTPException(status_code=400, detail="El trabajador no tiene correo registrado")

        action = normalize_action(body.action)
        code = str(random.randint(100000, 999999))

        OTP_STORE[str(body.worker_id)] = {
            "code": code,
            "action": action
        }

        resend.Emails.send({
            "from": "Kiosko <onboarding@resend.dev>",
            "to": [email],
            "subject": "Código de verificación",
            "html": f"""
                <div style="font-family: Arial, sans-serif; padding: 24px;">
                    <h2>Código de verificación</h2>
                    <p>Tu código para registrar <b>{action}</b> es:</p>
                    <h1 style="letter-spacing: 6px;">{code}</h1>
                </div>
            """
        })

        return {
            "ok": True,
            "email": email,
            "worker_id": body.worker_id,
            "action": action
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/verify-otp")
def verify_otp(body: VerifyOtpReq):
    try:
        saved = OTP_STORE.get(str(body.worker_id))
        if not saved:
            raise HTTPException(status_code=400, detail="No hay código activo")

        action = normalize_action(body.action)

        if saved["code"] != body.code.strip():
            raise HTTPException(status_code=400, detail="Código incorrecto")

        if saved["action"] != action:
            raise HTTPException(
                status_code=400,
                detail=f"Acción inválida. Esperada: {saved['action']}, recibida: {action}"
            )

        worker = db.get_worker_by_id(body.worker_id)
        if not worker:
            raise HTTPException(status_code=404, detail="Trabajador no encontrado")

        log = db.create_log(
            full_name=worker["full_name"],
            employee_no=str(worker["employee_no"]),
            area=worker["area"],
            action=action,
            method="Código"
        )

        del OTP_STORE[str(body.worker_id)]

        return {
            "ok": True,
            "log": log
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al verificar OTP: {str(e)}")


# =========================
# WORKERS
# =========================
@app.get("/workers")
def get_workers():
    try:
        return db.list_workers()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/workers")
def create_worker(body: WorkerCreateReq):
    try:
        return db.create_worker(body.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/workers/{worker_id}")
def put_worker(worker_id: int, body: WorkerUpdateReq):
    try:
        updated = db.update_worker(worker_id, body)

        if not updated:
            raise HTTPException(status_code=404, detail="Trabajador no encontrado")

        return updated

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/workers/{worker_id}")
def delete_worker(worker_id: int):
    try:
        deleted = db.delete_worker(worker_id)

        if not deleted:
            raise HTTPException(status_code=404, detail="Trabajador no encontrado")

        return {"ok": True}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# LOGS
# =========================
@app.get("/logs")
def get_logs():
    try:
        return db.list_logs()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/logs")
def create_log(payload: dict):
    try:
        return db.create_log(
            full_name=payload["full_name"],
            employee_no=str(payload["employee_no"]),
            area=payload["area"],
            action=payload["action"],
            method=payload["method"],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# VISITORS
# =========================
@app.get("/visitors")
def get_visitors():
    try:
        return db.list_visitors()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/visitors")
def post_visitor(body: VisitorCreateReq):
    try:
        return db.create_visitor(
            full_name=body.full_name,
            company=body.company,
            phone=body.phone,
            reason=body.reason,
            photo_uri=body.photo_uri,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# =========================
# ADMINS
# =========================
@app.post("/admin/login")
def admin_login(body: AdminLoginReq):
    try:
        admin = db.admin_login(body.username, body.password)
        if not admin:
            raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
        return {"ok": True, "admin": admin["username"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admins")
def post_admin(body: AdminCreateReq):
    try:
        admin = db.create_admin(
            username=body.username,
            password=body.password,
            email=body.email
        )
        return {"ok": True, "admin": admin}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admins/change-password")
def post_change_password(body: ChangePasswordReq):
    try:
        return db.change_admin_password(
            username=body.username,
            current_password=body.current_password,
            new_password=body.new_password,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admins/forgot-password")
def admin_forgot_password(body: ForgotAdminPasswordReq):
    try:
        admin = db.get_admin_by_email(body.email)
        if not admin:
            raise HTTPException(status_code=404, detail="No existe un administrador con ese correo")

        code = str(random.randint(100000, 999999))
        email = body.email.strip().lower()
        ADMIN_RESET_STORE[email] = code

        resend.Emails.send({
            "from": "Kiosko <onboarding@resend.dev>",
            "to": [email],
            "subject": "Recuperación de contraseña",
            "html": f"""
                <div style="font-family: Arial, sans-serif; padding: 24px;">
                    <h2>Recuperación de contraseña</h2>
                    <p>Tu código para restablecer la contraseña es:</p>
                    <h1 style="letter-spacing: 6px;">{code}</h1>
                </div>
            """
        })

        return {"ok": True, "email": email}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/admins/verify-reset")
def admin_verify_reset(body: VerifyAdminResetReq):
    try:
        email = body.email.strip().lower()
        saved = ADMIN_RESET_STORE.get(email)

        if not saved:
            raise HTTPException(status_code=400, detail="No hay código activo para ese correo")

        if saved != body.code.strip():
            raise HTTPException(status_code=400, detail="Código incorrecto")

        result = db.reset_admin_password_by_email(email, body.new_password)
        del ADMIN_RESET_STORE[email]

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))