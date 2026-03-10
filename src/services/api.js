import { API_BASE_URL } from "../config/api";

async function handleJson(res) {
  const text = await res.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const msg =
      typeof data === "string"
        ? data
        : data?.detail
        ? JSON.stringify(data.detail)
        : JSON.stringify(data);

    throw new Error(msg || `HTTP ${res.status}`);
  }

  return data;
}

export async function adminLogin(payload) {
  const res = await fetch(`${API_BASE_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function fetchAdmins() {
  const res = await fetch(`${API_BASE_URL}/admins`);
  return handleJson(res);
}

export async function createAdmin(payload) {
  const res = await fetch(`${API_BASE_URL}/admins`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function changeAdminPassword(payload) {
  const res = await fetch(`${API_BASE_URL}/admin/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function fetchWorkers() {
  const res = await fetch(`${API_BASE_URL}/workers`);
  return handleJson(res);
}

export async function createWorker(payload) {
  const res = await fetch(`${API_BASE_URL}/workers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function updateWorker(workerId, payload) {
  const res = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function deleteWorker(workerId) {
  const res = await fetch(`${API_BASE_URL}/workers/${workerId}`, {
    method: "DELETE",
  });
  return handleJson(res);
}

export async function fetchLogs() {
  const res = await fetch(`${API_BASE_URL}/logs`);
  return handleJson(res);
}

export async function createLog(payload) {
  const res = await fetch(`${API_BASE_URL}/logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function sendOtp(payload) {
  const res = await fetch(`${API_BASE_URL}/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function verifyOtp(payload) {
  const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export async function fetchVisitors() {
  const res = await fetch(`${API_BASE_URL}/visitors`);
  return handleJson(res);
}

export async function createVisitor(payload) {
  const res = await fetch(`${API_BASE_URL}/visitors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleJson(res);
}

export function getAsistenciaExcelUrl() {
  return `${API_BASE_URL}/export/asistencia.xlsx`;
}