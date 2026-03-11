const API_BASE_URL = "http://10.0.2.2:8001";

async function handleJson(res) {
  let data = {};
  let rawText = "";

  try {
    rawText = await res.text();
    data = rawText ? JSON.parse(rawText) : {};
  } catch (e) {
    data = {};
  }

  if (!res.ok) {
    throw new Error(
      data?.detail ||
        data?.message ||
        `HTTP ${res.status}${rawText ? ` - ${rawText}` : ""}`
    );
  }

  return data;
}

// =========================
// EMPLEADOS
// =========================
export async function fetchWorkers() {
  const res = await fetch(`${API_BASE_URL}/workers`);
  return handleJson(res);
}

export async function createWorker(payload) {
  const res = await fetch(`${API_BASE_URL}/workers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJson(res);
}

export async function updateWorker(id, payload) {
  const res = await fetch(`${API_BASE_URL}/workers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJson(res);
}

export async function deleteWorker(id) {
  const res = await fetch(`${API_BASE_URL}/workers/${id}`, {
    method: "DELETE",
  });

  return handleJson(res);
}

// =========================
// OTP
// =========================
export async function sendOtp(payload) {
  const res = await fetch(`${API_BASE_URL}/send-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJson(res);
}

export async function verifyOtp(payload) {
  const res = await fetch(`${API_BASE_URL}/verify-otp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJson(res);
}

// =========================
// LOGS / ASISTENCIA
// =========================
export async function fetchLogs() {
  const res = await fetch(`${API_BASE_URL}/logs`);
  return handleJson(res);
}

export async function createLog(payload) {
  const res = await fetch(`${API_BASE_URL}/logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJson(res);
}

export function getAsistenciaExcelUrl() {
  return `${API_BASE_URL}/export/asistencia.xlsx`;
}

// =========================
// VISITANTES
// =========================
export async function fetchVisitors() {
  const res = await fetch(`${API_BASE_URL}/visitors`);
  return handleJson(res);
}

export async function createVisitor(payload) {
  const res = await fetch(`${API_BASE_URL}/visitors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJson(res);
}

// =========================
// ADMIN
// =========================
export async function adminLogin(payload) {
  const res = await fetch(`${API_BASE_URL}/admin/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJson(res);
}

export async function createAdmin(payload) {
  const res = await fetch(`${API_BASE_URL}/admins`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJson(res);
}

export async function changeAdminPassword(payload) {
  const res = await fetch(`${API_BASE_URL}/admins/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return handleJson(res);
}