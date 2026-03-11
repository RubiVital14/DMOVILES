import os
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import resend
import db

# cargar variables de entorno
load_dotenv()

RESEND_API_KEY = os.getenv("RESEND_API_KEY")

if not RESEND_API_KEY:
    raise Exception("RESEND_API_KEY no encontrada en .env")

resend.api_key = RESEND_API_KEY

# 👇 ESTA LÍNEA ES LA QUE UVICORN NECESITA
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# inicializar base de datos
db.init_db()

# guardar códigos OTP temporalmente
OTP_STORE = {}


# ======================
# MODELOS
# ======================

class SendOtpReq(BaseModel):
    worker_id: int
    action: str


class VerifyOtpReq(BaseModel):
    worker_id: int
    code: str
    action: str


# ======================
# ENVIAR OTP
# ======================

@app.post("/send-otp")
def send_otp(body: SendOtpReq):

    worker = db.get_worker_by_id(body.worker_id)

    if not worker:
        raise HTTPException(status_code=404, detail="Trabajador no encontrado")

    email = worker.get("email")

    if not email:
        raise HTTPException(status_code=400, detail="El trabajador no tiene correo registrado")

    code = str(random.randint(100000, 999999))

    OTP_STORE[str(body.worker_id)] = {
        "code": code,
        "action": body.action
    }

    try:
        resend.Emails.send({
            "from": "Kiosko <onboarding@resend.dev>",
            "to": [email],
            "subject": "Código de verificación",
            "html": f"<h2>Tu código es: {code}</h2>"
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "ok": True,
        "email": email
    }


# ======================
# VERIFICAR OTP
# ======================

@app.post("/verify-otp")
def verify_otp(body: VerifyOtpReq):

    saved = OTP_STORE.get(str(body.worker_id))

    if not saved:
        raise HTTPException(status_code=400, detail="No hay código activo")

    if saved["code"] != body.code:
        raise HTTPException(status_code=400, detail="Código incorrecto")

    worker = db.get_worker_by_id(body.worker_id)

    log = db.create_log(
        full_name=worker["full_name"],
        employee_no=worker["employee_no"],
        area=worker["area"],
        action=body.action,
        method="Código"
    )

    del OTP_STORE[str(body.worker_id)]

    return {
        "ok": True,
        "log": log
    }


# ======================
# WORKERS
# ======================

@app.get("/workers")
def get_workers():
    return db.list_workers()


# ======================
# LOGS
# ======================

@app.get("/logs")
def get_logs():
    return db.list_logs()


# ======================
# VISITORS
# ======================

@app.get("/visitors")
def get_visitors():
    return db.list_visitors()

    from pydantic import BaseModel

class AdminLoginReq(BaseModel):
    username: str
    password: str

class AdminCreateReq(BaseModel):
    username: str
    password: str

class ChangePasswordReq(BaseModel):
    username: str
    current_password: str
    new_password: str


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
        admin = db.create_admin(body.username, body.password)
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